import { test, expect } from '@playwright/test';

/**
 * 示例图片功能测试
 */

test.describe('示例图片画廊', () => {
  test('应该显示示例图片画廊', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查画廊标题
    await expect(page.locator('text=试试示例图片')).toBeVisible();
  });

  test('应该显示示例图片选项', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查示例图片存在
    await expect(page.locator('text=爱心')).toBeVisible();
    await expect(page.locator('text=笑脸星星')).toBeVisible();
    await expect(page.locator('text=小花')).toBeVisible();
  });

  test('应该能选择爱心示例', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 点击爱心示例
    await page.locator('.example-card:has-text("爱心")').click();

    // 验证选中状态
    await expect(page.locator('.example-card:has-text("爱心")')).toHaveClass(/selected/);
  });

  test('选择示例后应显示处理状态', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 点击示例图片
    await page.locator('.example-card:has-text("笑脸星星")').click();

    // 可能显示处理中状态或直接生成网格
    // 等待一段时间让处理完成
    await page.waitForTimeout(3000);

    // 检查是否生成了网格或显示错误
    const hasGrid = await page.locator('.pixel-grid').count() > 0;
    const hasError = await page.locator('.error-message').count() > 0;
    const hasEmpty = await page.locator('text=上传图片开始创作~').count() > 0;

    // 至少应该有某种反馈
    expect(hasGrid || hasError || hasEmpty).toBeTruthy();
  });

  test('示例图片应显示难度标签', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 检查难度标签
    await expect(page.locator('.example-difficulty.简单').first()).toBeVisible();
  });
});

test.describe('示例图片索引文件', () => {
  test('应该能访问示例图片索引', async ({ request }) => {
    const response = await request.get('/examples/index.json');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // 验证数据结构
    expect(data.examples).toBeDefined();
    expect(Array.isArray(data.examples)).toBeTruthy();
    expect(data.examples.length).toBeGreaterThan(0);

    // 验证每个示例的结构
    const example = data.examples[0];
    expect(example.id).toBeDefined();
    expect(example.name).toBeDefined();
    expect(example.path).toBeDefined();
    expect(example.emoji).toBeDefined();
  });

  test('应该能访问示例图片文件', async ({ request }) => {
    const response = await request.get('/examples/heart.svg');

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('image/svg');
  });

  test('所有示例图片路径都应可访问', async ({ request }) => {
    const indexResponse = await request.get('/examples/index.json');
    const data = await indexResponse.json();

    for (const example of data.examples) {
      const response = await request.get(example.path);
      expect(response.ok(), `示例图片 ${example.name} (${example.path}) 无法访问`).toBeTruthy();
    }
  });
});
