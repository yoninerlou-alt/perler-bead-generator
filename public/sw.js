/**
 * 拼豆图纸生成器 Service Worker
 * 离线缓存策略：缓存优先 + 网络回退
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `perler-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `perler-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `perler-data-${CACHE_VERSION}`;

// 静态资源（应用骨架）
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/globals.css',
];

// 数据资源（色号数据）
const DATA_ASSETS = [
  '/data/colorSystemMapping.json'
];

// 安装：预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...', CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] 部分静态资源缓存失败:', err);
        });
      }),
      caches.open(DATA_CACHE).then((cache) => {
        console.log('[SW] 预缓存数据资源');
        return cache.addAll(DATA_ASSETS).catch((err) => {
          console.warn('[SW] 部分数据资源缓存失败:', err);
        });
      })
    ]).then(() => {
      console.log('[SW] 安装完成，跳过等待');
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('perler-') &&
              !name.endsWith(CACHE_VERSION)
            );
          })
          .map((name) => {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] 激活完成，接管控制');
      return self.clients.claim();
    })
  );
});

// 请求拦截：缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 同源请求处理
  if (url.origin === self.location.origin) {
    // 数据资源：缓存优先（数据更新少）
    if (url.pathname.includes('colorSystemMapping') || url.pathname.includes('/data/')) {
      event.respondWith(cacheFirstStrategy(request, DATA_CACHE));
      return;
    }

    // 静态资源（CSS、JS、字体、图片）
    if (
      url.pathname.match(/\.(css|js|woff2?|ttf|png|jpg|jpeg|gif|svg|ico)$/) ||
      url.pathname === '/'
    ) {
      event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
      return;
    }

    // Next.js 的 _next 资源
    if (url.pathname.startsWith('/_next/')) {
      event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
      return;
    }

    // 页面导航：网络优先，离线时返回缓存
    if (request.mode === 'navigate') {
      event.respondWith(networkFirstStrategy(request));
      return;
    }
  }

  // 其他请求：网络优先，失败时尝试缓存
  event.respondWith(networkFirstStrategy(request));
});

/**
 * 缓存优先策略
 * 先查缓存，缓存未命中再请求网络
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // 后台更新缓存
    fetchAndUpdateCache(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] 网络请求失败，无缓存可用:', request.url);
    return new Response('离线状态，资源不可用', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * 网络优先策略
 * 先请求网络，失败时返回缓存
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 导航请求且无缓存时，返回首页
    if (request.mode === 'navigate') {
      const homeResponse = await caches.match('/');
      if (homeResponse) {
        return homeResponse;
      }
    }

    return new Response('离线状态，请检查网络连接', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * 后台更新缓存
 */
async function fetchAndUpdateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // 静默失败
  }
}

// 消息处理：手动更新缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }
});
