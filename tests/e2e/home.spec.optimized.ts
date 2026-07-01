import { test, expect } from '@playwright/test';

/**
 * 主页面基础功能测试
 * 优化版 - 移除固定等待，使用智能等待
 */

test.describe('主页加载', () => {
  test('应该正确加载主页面', async ({ page }) => {
    await page.goto('/');

    // 智能等待：等待页面完全加载
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle(/拼豆图纸生成器/);

    // 检查主容器存在
    await expect(page.locator('main.cute-main')).toBeVisible();
  });

  test('应该显示品牌选择器', async ({ page }) => {
    await page.goto('/');

    // ❌ 删除：await page.waitForTimeout(2000);
    // ✅ 替换为：等待品牌按钮出现
    await expect(page.locator('text=🎯 Perler')).toBeVisible({ timeout: 5000 });

    // 检查品牌按钮
    await expect(page.locator('text=🎯 Perler')).toBeVisible();
    await expect(page.locator('text=🌈 Hama')).toBeVisible();
    await expect(page.locator('text=✨ Artkal')).toBeVisible();
  });

  test('应该显示图片上传区域', async ({ page }) => {
    await page.goto('/');

    // 等待上传区域出现
    await expect(page.locator('text=📸 上传图片')).toBeVisible({ timeout: 5000 });

    // 检查上传提示
    await expect(page.locator('text=拖拽图片到这里，或点击上传')).toBeVisible();
  });

  test('应该显示工具面板', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=🔧 工具')).toBeVisible({ timeout: 5000 });
  });

  test('应该显示导出设置', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=⚙️ 导出设置')).toBeVisible({ timeout: 5000 });

    // 检查设置选项
    await expect(page.locator('text=显示网格')).toBeVisible();
    await expect(page.locator('text=显示坐标')).toBeVisible();
    await expect(page.locator('text=显示色号')).toBeVisible();
  });

  test('未上传图片时应显示空状态', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=上传图片开始创作~')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('品牌切换', () => {
  test('应该能切换到Hama品牌', async ({ page }) => {
    await page.goto('/');

    // 等待品牌按钮就绪
    await expect(page.locator('text=🌈 Hama')).toBeVisible({ timeout: 5000 });

    // 点击Hama按钮
    await page.locator('text=🌈 Hama').click();

    // 验证Hama按钮处于激活状态（无需等待）
    await expect(page.locator('text=🌈 Hama')).toHaveClass(/active/);
  });

  test('应该能切换到Artkal品牌', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=✨ Artkal')).toBeVisible({ timeout: 5000 });

    await page.locator('text=✨ Artkal').click();

    await expect(page.locator('text=✨ Artkal')).toHaveClass(/active/);
  });

  test('应该能切换回Perler品牌', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=🌈 Hama')).toBeVisible({ timeout: 5000 });

    // 先切换到Hama
    await page.locator('text=🌈 Hama').click();

    // ❌ 删除：await page.waitForTimeout(500);
    // ✅ 无需等待，立即切换回Perler
    await page.locator('text=🎯 Perler').click();

    await expect(page.locator('text=🎯 Perler')).toHaveClass(/active/);
  });
});

test.describe('导出设置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 只在describe级别等待一次
    await expect(page.locator('text=⚙️ 导出设置')).toBeVisible({ timeout: 5000 });
  });

  test('应该能切换显示网格选项', async ({ page }) => {
    const gridCheckbox = page.locator('label:has-text("显示网格") input[type="checkbox"]');

    // 获取初始状态
    const initialState = await gridCheckbox.isChecked();

    // 点击切换
    await gridCheckbox.click();

    // 验证状态改变
    await expect(gridCheckbox).toBeChecked({ checked: !initialState });
  });

  test('应该能切换显示坐标选项', async ({ page }) => {
    const coordCheckbox = page.locator('label:has-text("显示坐标") input[type="checkbox"]');
    const initialState = await coordCheckbox.isChecked();

    await coordCheckbox.click();

    await expect(coordCheckbox).toBeChecked({ checked: !initialState });
  });

  test('应该能切换显示色号选项', async ({ page }) => {
    const codeCheckbox = page.locator('label:has-text("显示色号") input[type="checkbox"]');
    const initialState = await codeCheckbox.isChecked();

    await codeCheckbox.click();

    await expect(codeCheckbox).toBeChecked({ checked: !initialState });
  });
});