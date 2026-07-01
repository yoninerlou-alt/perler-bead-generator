import { test, expect } from '@playwright/test';

/**
 * 色号数据完整性测试
 */

test.describe('色号数据文件', () => {
  test('应该能访问色号数据文件', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // 验证三个品牌都存在
    expect(data.perler).toBeDefined();
    expect(data.hama).toBeDefined();
    expect(data.artkal).toBeDefined();
  });

  test('Perler品牌应有103种颜色', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    expect(data.perler.brandName).toBe('Perler');
    expect(data.perler.totalColors).toBe(103);
    expect(data.perler.colorData.length).toBe(103);
  });

  test('Hama品牌应有92种颜色', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    expect(data.hama.brandName).toBe('Hama');
    expect(data.hama.totalColors).toBe(92);
    expect(data.hama.colorData.length).toBe(92);
  });

  test('Artkal品牌应有199种颜色', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    expect(data.artkal.brandName).toBe('Artkal');
    expect(data.artkal.totalColors).toBe(199);
    expect(data.artkal.colorData.length).toBe(199);
  });
});

test.describe('色号数据结构', () => {
  test('每个颜色应包含完整数据', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    // 检查Perler第一个颜色
    const color = data.perler.colorData[0];

    expect(color.id).toBeDefined();
    expect(color.code).toBeDefined();
    expect(color.name).toBeDefined();
    expect(color.hex).toBeDefined();
    expect(color.rgb).toBeDefined();
    expect(color.rgb.r).toBeDefined();
    expect(color.rgb.g).toBeDefined();
    expect(color.rgb.b).toBeDefined();
    expect(color.lab).toBeDefined();
    expect(color.category).toBeDefined();
    expect(color.purchaseUrl).toBeDefined();
  });

  test('HEX值格式应正确', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    const hexRegex = /^#[0-9A-F]{6}$/i;

    // 检查所有品牌的HEX格式
    for (const brand of ['perler', 'hama', 'artkal']) {
      for (const color of data[brand].colorData) {
        expect(color.hex, `${brand} 颜色 ${color.code} 的HEX格式错误: ${color.hex}`).toMatch(hexRegex);
      }
    }
  });

  test('RGB值应在有效范围内', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    for (const brand of ['perler', 'hama', 'artkal']) {
      for (const color of data[brand].colorData) {
        expect(color.rgb.r, `${brand} ${color.code} R值越界`).toBeGreaterThanOrEqual(0);
        expect(color.rgb.r, `${brand} ${color.code} R值越界`).toBeLessThanOrEqual(255);
        expect(color.rgb.g, `${brand} ${color.code} G值越界`).toBeGreaterThanOrEqual(0);
        expect(color.rgb.g, `${brand} ${color.code} G值越界`).toBeLessThanOrEqual(255);
        expect(color.rgb.b, `${brand} ${color.code} B值越界`).toBeGreaterThanOrEqual(0);
        expect(color.rgb.b, `${brand} ${color.code} B值越界`).toBeLessThanOrEqual(255);
      }
    }
  });

  test('颜色ID应唯一', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    for (const brand of ['perler', 'hama', 'artkal']) {
      const ids = data[brand].colorData.map((c: any) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size, `${brand} 存在重复的颜色ID`).toBe(ids.length);
    }
  });

  test('颜色色号应唯一', async ({ request }) => {
    const response = await request.get('/data/colorSystemMapping.json');
    const data = await response.json();

    for (const brand of ['perler', 'hama', 'artkal']) {
      const codes = data[brand].colorData.map((c: any) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size, `${brand} 存在重复的色号`).toBe(codes.length);
    }
  });
});

test.describe('色号数据加载', () => {
  test('页面应能加载色号系统', async ({ page }) => {
    await page.goto('/');

    // 等待色号系统加载
    await page.waitForTimeout(3000);

    // 品牌选择器应该可见（说明色号系统已加载）
    await expect(page.locator('text=🎯 Perler')).toBeVisible();
  });

  test('切换品牌应能加载不同色号', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 切换到Artkal（颜色最多）
    await page.locator('text=✨ Artkal').click();
    await page.waitForTimeout(1000);

    // 验证Artkal已激活
    await expect(page.locator('text=✨ Artkal')).toHaveClass(/active/);

    // 切换回Perler
    await page.locator('text=🎯 Perler').click();
    await page.waitForTimeout(1000);

    // 验证Perler已激活
    await expect(page.locator('text=🎯 Perler')).toHaveClass(/active/);
  });
});
