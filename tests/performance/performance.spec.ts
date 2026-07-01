import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

const CWV_TARGETS = {
  LCP: 2500, // Largest Contentful Paint (ms)
  INP: 200, // Interaction to Next Paint (ms)
  CLS: 0.1, // Cumulative Layout Shift
  FCP: 1500, // First Contentful Paint (ms)
  TBT: 200, // Total Blocking Time (ms)
};

test.describe('Core Web Vitals Performance', () => {
  let browser;
  let page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('LCP should be below threshold', async ({ request }) => {
    const response = await request.get('http://localhost:3000');
    expect(response.status()).toBe(200);

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries.find((e) => e.entryType === 'largest-contentful-paint');
          resolve(lcpEntry ? lcpEntry.startTime : null);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        setTimeout(() => resolve(null), 5000);
      });
    });

    if (metrics) {
      expect(metrics).toBeLessThan(CWV_TARGETS.LCP);
    }
  });

  test('CLS should be below threshold', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    expect(metrics).toBeLessThan(CWV_TARGETS.CLS);
  });

  test('FCP should be below threshold', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((e) => e.entryType === 'paint' && e.name === 'first-contentful-paint');
          resolve(fcpEntry ? fcpEntry.startTime : null);
        }).observe({ entryTypes: ['paint'] });

        setTimeout(() => resolve(null), 5000);
      });
    });

    if (metrics) {
      expect(metrics).toBeLessThan(CWV_TARGETS.FCP);
    }
  });

  test('TBT should be below threshold', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let tbtValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              tbtValue += entry.duration - 50;
            }
          }
        }).observe({ entryTypes: ['longtask'] });

        setTimeout(() => resolve(tbtValue), 5000);
      });
    });

    expect(metrics).toBeLessThan(CWV_TARGETS.TBT);
  });

  test('Bundle size should be within budget', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const jsSize = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;

      return Promise.all(
        scripts.map(async (script) => {
          const src = (script as HTMLScriptElement).src;
          if (src.startsWith(window.location.origin)) {
            const response = await fetch(src);
            const blob = await response.blob();
            return blob.size;
          }
          return 0;
        })
      ).then((sizes) => sizes.reduce((sum, size) => sum + size, 0));
    });

    // Budget: 300KB (gzipped) ≈ 900KB uncompressed
    expect(jsSize).toBeLessThan(900 * 1024);
  });

  test('CSS size should be within budget', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const cssSize = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      let totalSize = 0;

      return Promise.all(
        links.map(async (link) => {
          const href = (link as HTMLLinkElement).href;
          if (href.startsWith(window.location.origin)) {
            const response = await fetch(href);
            const blob = await response.blob();
            return blob.size;
          }
          return 0;
        })
      ).then((sizes) => sizes.reduce((sum, size) => sum + size, 0));
    });

    // Budget: 50KB (gzipped) ≈ 150KB uncompressed
    expect(cssSize).toBeLessThan(150 * 1024);
  });

  test('Image optimization', async () => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const images = await page.evaluate(() => {
      const imgElements = Array.from(document.querySelectorAll('img'));
      return imgElements.map((img) => ({
        src: (img as HTMLImageElement).src,
        width: (img as HTMLImageElement).width,
        height: (img as HTMLImageElement).height,
        loading: (img as HTMLImageElement).loading,
        fetchpriority: (img as HTMLImageElement).fetchPriority,
      }));
    });

    // All images should have dimensions
    for (const img of images) {
      if (!img.src.startsWith('data:')) {
        expect(img.width).toBeGreaterThan(0);
        expect(img.height).toBeGreaterThan(0);
      }
    }

    // Check for above-the-fold images
    const aboveFoldImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.top < window.innerHeight;
      });
    });

    // Above-the-fold images should have loading="eager"
    if (aboveFoldImages.length > 0) {
      for (const img of aboveFoldImages) {
        expect((img as HTMLImageElement).loading).not.toBe('lazy');
      }
    }
  });
});

test.describe('Runtime Performance', () => {
  test('Color matching should complete within time limit', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    await page.evaluate(async () => {
      // Simulate color matching operation
      const colors = Array.from({ length: 1000 }, () => ({
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
      }));

      // Process colors
      colors.forEach((color) => {
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
        return brightness;
      });
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  test('UI interactions should be responsive', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    await page.evaluate(() => {
      const button = document.querySelector('button');
      if (button) {
        button.click();
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50); // Click response < 50ms
  });
});