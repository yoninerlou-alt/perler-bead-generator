/**
 * 拼豆图纸生成器 - 核心库
 * @version 1.0.0
 */

// ========== 类型定义 ==========
export type * from '@/types';

// ========== 核心算法 ==========
export * from '@/lib/algorithms';

// ========== 工具函数 ==========
export {
  rgbToOklab,
  calculateDeltaE,
  rgbToHex,
  getContrastColor,
  rgbToHsl,
  type HslColor
} from '@/lib/utils/colorUtils';

export {
  LRUCache,
  ColorMatchCache,
  VirtualScrollCalculator,
  PerformanceMonitor,
  debounce,
  throttle,
  batch
} from '@/lib/utils/performanceUtils';

// ========== 数据管理 ==========
export {
  ColorDataManager,
  colorDataManager
} from '@/lib/data/colorDataManager';

// ========== 导出功能 ==========
export * from '@/lib/export';

// ========== Web Worker支持 ==========
export * from '@/lib/workers';

// ========== AI功能 ==========
export * from '@/lib/ai';