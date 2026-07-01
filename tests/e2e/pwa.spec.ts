import { test, expect } from '@playwright/test';

/**
 * PWA功能测试
 */

test.describe('PWA配置', () => {
  test('应该能访问manifest.json', async ({ request }) => {
    const response = await request.get('/manifest.json');

    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    // 验证manifest基本字段
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#FF6B9D');
    expect(manifest.background_color).toBe('#FFF9F0');
  });

  test('manifest应包含图标配置', async ({ request }) => {
    const response = await request.get('/manifest.json');
    const manifest = await response.json();

    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // 验证图标尺寸
    const sizes = manifest.icons.map((icon: any) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('manifest应包含快捷方式', async ({ request }) => {
    const response = await request.get('/manifest.json');
    const manifest = await response.json();

    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBe(3);

    // 验证快捷方式包含品牌
    const shortcutNames = manifest.shortcuts.map((s: any) => s.short_name);
    expect(shortcutNames).toContain('Perler');
    expect(shortcutNames).toContain('Hama');
    expect(shortcutNames).toContain('Artkal');
  });

  test('应该能访问Service Worker', async ({ request }) => {
    const response = await request.get('/sw.js');

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('javascript');
  });

  test('应该能访问图标文件', async ({ request }) => {
    const icon192 = await request.get('/icon-192.svg');
    expect(icon192.ok()).toBeTruthy();

    const icon512 = await request.get('/icon-512.svg');
    expect(icon512.ok()).toBeTruthy();
  });

  test('应该能访问离线页面', async ({ request }) => {
    const response = await request.get('/offline.html');

    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Service Worker注册', () => {
  test('应该在页面加载时注册Service Worker', async ({ page }) => {
    await page.goto('/');

    // 等待Service Worker注册
    await page.waitForTimeout(3000);

    // 检查Service Worker是否已注册
    const isRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;

      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });

    expect(isRegistered).toBeTruthy();
  });

  test('页面应包含manifest链接', async ({ page }) => {
    await page.goto('/');

    // 检查manifest链接
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });

  test('页面应包含主题色配置', async ({ page }) => {
    await page.goto('/');

    // 检查theme-color meta标签
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    await expect(themeColorMeta).toHaveAttribute('content', '#FF6B9D');
  });
});

test.describe('离线访问', () => {
  test('Service Worker应包含离线缓存逻辑', async ({ request }) => {
    const response = await request.get('/sw.js');
    const swContent = await response.text();

    // 验证Service Worker包含必要的缓存逻辑
    expect(swContent).toContain('install');
    expect(swContent).toContain('activate');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('caches');
    expect(swContent).toContain('STATIC_CACHE');
    expect(swContent).toContain('DYNAMIC_CACHE');
  });

  test('Service Worker应包含缓存策略', async ({ request }) => {
    const response = await request.get('/sw.js');
    const swContent = await response.text();

    // 验证包含缓存策略函数
    expect(swContent).toContain('cacheFirstStrategy');
    expect(swContent).toContain('networkFirstStrategy');
  });
});
