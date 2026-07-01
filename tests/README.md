# 拼豆图纸生成器 - 测试文档

## 测试概览

本项目使用 **Playwright** 进行端到端（E2E）测试，覆盖以下功能模块：

| 测试文件 | 测试内容 | 测试数量 |
|----------|----------|----------|
| `home.spec.ts` | 主页面加载、品牌切换、导出设置 | 9 |
| `examples.spec.ts` | 示例图片画廊、图片加载 | 7 |
| `pwa.spec.ts` | PWA配置、Service Worker、离线支持 | 9 |
| `ui-components.spec.ts` | UI组件渲染、响应式布局、主题样式 | 8 |
| `color-data.spec.ts` | 色号数据完整性、数据结构验证 | 8 |
| **总计** | | **41** |

## 运行测试

### 运行所有测试

```bash
npm run test:e2e
```

### 以UI模式运行（推荐开发时使用）

```bash
npm run test:e2e:ui
```

UI模式提供可视化界面，可以：
- 实时查看测试执行
- 调试测试
- 查看截图和视频
- 时间旅行调试

### 调试模式

```bash
npm run test:e2e:debug
```

### 查看测试报告

```bash
npm run test:e2e:report
```

## 测试分类

### 1. 主页面测试 (`home.spec.ts`)

验证主页面的基本功能：
- ✅ 页面正确加载
- ✅ 品牌选择器显示
- ✅ 图片上传区域显示
- ✅ 工具面板显示
- ✅ 导出设置显示
- ✅ 空状态提示
- ✅ 品牌切换功能
- ✅ 导出设置切换

### 2. 示例图片测试 (`examples.spec.ts`)

验证示例图片功能：
- ✅ 画廊显示
- ✅ 示例图片选项
- ✅ 选择示例图片
- ✅ 处理状态反馈
- ✅ 难度标签显示
- ✅ 索引文件可访问
- ✅ 图片文件可访问

### 3. PWA测试 (`pwa.spec.ts`)

验证PWA功能：
- ✅ manifest.json配置
- ✅ 图标配置
- ✅ 快捷方式
- ✅ Service Worker可访问
- ✅ 图标文件可访问
- ✅ 离线页面可访问
- ✅ Service Worker注册
- ✅ manifest链接
- ✅ 主题色配置
- ✅ 缓存策略

### 4. UI组件测试 (`ui-components.spec.ts`)

验证UI组件和布局：
- ✅ 按钮可点击
- ✅ hover效果
- ✅ 工具按钮
- ✅ 导出按钮
- ✅ 桌面布局
- ✅ 移动端布局
- ✅ 平板布局
- ✅ 卡通主题样式
- ✅ CSS变量配置

### 5. 色号数据测试 (`color-data.spec.ts`)

验证色号数据完整性：
- ✅ 数据文件可访问
- ✅ Perler 103色
- ✅ Hama 92色
- ✅ Artkal 199色
- ✅ 数据结构完整
- ✅ HEX格式正确
- ✅ RGB值有效
- ✅ ID唯一性
- ✅ 色号唯一性
- ✅ 数据加载功能

## 测试配置

### 浏览器配置

- **桌面**: Chromium (1280x720)
- **移动端**: Pixel 5 (393x851)

### 环境配置

- **语言**: zh-CN
- **时区**: Asia/Shanghai
- **重试**: CI环境2次，本地0次
- **并行**: 完全并行

### Web服务器配置

测试会自动启动开发服务器：
- 命令: `npm run dev`
- URL: `http://localhost:3000`
- 超时: 120秒

## 持续集成

在CI环境中运行测试：

```bash
# CI模式（带重试）
CI=true npm run test:e2e

# 生成报告
npm run test:e2e:report
```

## 测试最佳实践

1. **使用语义化选择器**: 优先使用文本、角色选择器
2. **避免硬编码等待**: 使用 `waitForSelector` 或自动等待
3. **测试独立性**: 每个测试应独立运行，不依赖其他测试
4. **描述性测试名**: 使用中文描述测试意图
5. **断言明确**: 每个测试应有明确的断言

## 添加新测试

1. 在 `tests/e2e/` 目录创建新的 `.spec.ts` 文件
2. 按功能模块组织测试
3. 使用 `test.describe` 分组相关测试
4. 遵循现有的命名和结构约定

示例：

```typescript
import { test, expect } from '@playwright/test';

test.describe('新功能', () => {
  test('应该完成某操作', async ({ page }) => {
    await page.goto('/');
    // 测试逻辑
    await expect(page.locator('selector')).toBeVisible();
  });
});
```
