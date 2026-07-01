import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright优化配置
 * 针对验证速度进行优化
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,  // 减少重试次数
  workers: process.env.CI ? 2 : undefined,  // 本地使用全部CPU，CI限制并发

  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',  // 关闭视频录制（除非失败）
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    actionTimeout: 5000,  // 操作超时从默认30秒减少到5秒
    navigationTimeout: 10000  // 导航超时从默认60秒减少到10秒
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu', '--disable-dev-shm-usage']  // 无头模式优化
        }
      }
    },
    // ❌ 暂时移除移动端测试（如需测试可手动启用）
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] }
    // }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,  // ✅ 复用现有服务器
    timeout: 60000,  // 服务器启动超时从120秒减少到60秒
    port: 3000
  },

  // 全局超时
  timeout: 30000  // 单个测试超时从默认无限制改为30秒
});