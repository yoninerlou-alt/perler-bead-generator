/**
 * 性能优化工具
 * 包含LRU缓存、虚拟滚动等
 */

/**
 * LRU缓存实现
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private ttl: number;  // 毫秒
  private timestamps: Map<K, number>;

  constructor(maxSize: number, ttl: number = 60000) {
    this.cache = new Map();
    this.timestamps = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const timestamp = this.timestamps.get(key);

    // 检查是否过期
    if (timestamp && Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    const value = this.cache.get(key);
    if (value !== undefined) {
      // 更新访问时间（LRU）
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    // 如果已存在，删除旧的
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过最大大小，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * 删除缓存值
   */
  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    this.timestamps.delete(key);
    return deleted;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查是否包含某个键
   */
  has(key: K): boolean {
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * 颜色匹配缓存
 */
export class ColorMatchCache {
  private cache: LRUCache<string, string>;

  constructor(maxSize: number = 10000, ttl: number = 3600000) {
    this.cache = new LRUCache(maxSize, ttl);
  }

  /**
   * 生成缓存键
   */
  private generateKey(rgb: { r: number; g: number; b: number }, paletteHash: string): string {
    return `${rgb.r},${rgb.g},${rgb.b}:${paletteHash}`;
  }

  /**
   * 获取匹配结果
   */
  get(rgb: { r: number; g: number; b: number }, paletteHash: string): string | undefined {
    const key = this.generateKey(rgb, paletteHash);
    return this.cache.get(key);
  }

  /**
   * 设置匹配结果
   */
  set(rgb: { r: number; g: number; b: number }, paletteHash: string, colorKey: string): void {
    const key = this.generateKey(rgb, paletteHash);
    this.cache.set(key, colorKey);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; cleaned: number } {
    const cleaned = this.cache.cleanup();
    return {
      size: this.cache.size(),
      cleaned
    };
  }
}

/**
 * 虚拟滚动项
 */
export interface VirtualItem {
  index: number;
  start: number;
  end: number;
}

/**
 * 虚拟滚动计算器
 */
export class VirtualScrollCalculator {
  private itemSize: number;
  private containerSize: number;
  private overscan: number;

  constructor(itemSize: number, containerSize: number, overscan: number = 3) {
    this.itemSize = itemSize;
    this.containerSize = containerSize;
    this.overscan = overscan;
  }

  /**
   * 计算可见项目
   */
  calculateVisible(scrollTop: number, totalItems: number): VirtualItem[] {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemSize) - this.overscan);
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + this.containerSize) / this.itemSize) + this.overscan
    );

    const items: VirtualItem[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * this.itemSize,
        end: (i + 1) * this.itemSize
      });
    }

    return items;
  }

  /**
   * 计算总高度
   */
  getTotalHeight(totalItems: number): number {
    return totalItems * this.itemSize;
  }

  /**
   * 滚动到指定项
   */
  scrollToItem(itemIndex: number, align: 'start' | 'center' | 'end' = 'start'): number {
    const itemTop = itemIndex * this.itemSize;

    switch (align) {
      case 'start':
        return itemTop;
      case 'center':
        return itemTop - (this.containerSize - this.itemSize) / 2;
      case 'end':
        return itemTop - (this.containerSize - this.itemSize);
      default:
        return itemTop;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(itemSize?: number, containerSize?: number, overscan?: number): void {
    if (itemSize !== undefined) this.itemSize = itemSize;
    if (containerSize !== undefined) this.containerSize = containerSize;
    if (overscan !== undefined) this.overscan = overscan;
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTime: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  start(label: string): void {
    this.startTime.set(label, performance.now());
  }

  /**
   * 结束计时并记录
   */
  end(label: string): number {
    const startTime = this.startTime.get(label);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.startTime.delete(label);

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    return duration;
  }

  /**
   * 获取平均时间
   */
  getAverage(label: string): number {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return 0;

    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * 获取所有指标
   */
  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {};

    for (const [label, values] of this.metrics.entries()) {
      const sum = values.reduce((a, b) => a + b, 0);
      const min = Math.min(...values);
      const max = Math.max(...values);

      result[label] = {
        average: sum / values.length,
        count: values.length,
        min,
        max
      };
    }

    return result;
  }

  /**
   * 清空指标
   */
  clear(label?: string): void {
    if (label) {
      this.metrics.delete(label);
      this.startTime.delete(label);
    } else {
      this.metrics.clear();
      this.startTime.clear();
    }
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    console.log('=== 性能报告 ===');
    const metrics = this.getMetrics();

    for (const [label, stats] of Object.entries(metrics)) {
      console.log(`${label}:`);
      console.log(`  平均: ${stats.average.toFixed(2)}ms`);
      console.log(`  次数: ${stats.count}`);
      console.log(`  最小: ${stats.min.toFixed(2)}ms`);
      console.log(`  最大: ${stats.max.toFixed(2)}ms`);
    }

    console.log('==================');
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      fn.apply(this, args);
      lastCall = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastCall = Date.now();
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };
}

/**
 * 批处理函数
 */
export function batch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  const batches: T[][] = [];

  // 分批
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  // 顺序处理
  return batches.reduce(async (acc, batch) => {
    const batchResults = await processor(batch);
    const accResults = await acc;
    accResults.push(...batchResults);
    return accResults;
  }, Promise.resolve<R[]>([]));
}