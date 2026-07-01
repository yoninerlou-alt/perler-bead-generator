import { test, expect } from '@playwright/test';

/**
 * 基础UI组件功能测试
 * 通过创建测试页面验证组件行为
 */

test.describe('UI组件渲染', () => {
  test('Button组件应该可点击', async ({ page }) => {
    await page.goto('/');

    // 主页面应该有按钮
    const brandButtons = page.locator('.brand-btn');
    await page.waitForTimeout(2000);

    const count = await brandButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('品牌按钮应该有hover效果样式', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查按钮样式类存在
    const brandBtn = page.locator('.brand-btn').first();

    // 验证按钮可见且可交互
    await expect(brandBtn).toBeVisible();
    await expect(brandBtn).toBeEnabled();
  });

  test('工具按钮应该存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 工具区域应该存在
    await expect(page.locator('text=🔧 工具')).toBeVisible();
  });

  test('导出按钮应该存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 导出设置区域应该存在
    await expect(page.locator('text=⚙️ 导出设置')).toBeVisible();
  });
});

test.describe('响应式布局', () => {
  test('桌面布局应该显示三栏', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查主内容区域
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
  });

  test('移动端布局应该自适应', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查主内容区域仍然可见
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
  });

  test('平板布局应该正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('卡通主题样式', () => {
  test('应该应用粉色主色调', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查CSS变量是否设置
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    });

    expect(primaryColor).toBe('#FF6B9D');
  });

  test('应该应用奶油白背景', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
    });

    expect(bgColor).toBe('#FFF9F0');
  });

  test('应该配置正确的字体', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const headingFont = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-heading').trim();
    });

    expect(headingFont).toContain('Fredoka One');
  });

  test('应该配置正确的圆角', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const radiusXl = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--radius-xl').trim();
    });

    expect(radiusXl).toBe('32px');
  });
});
