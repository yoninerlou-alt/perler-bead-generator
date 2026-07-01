/**
 * Web Worker管理器
 * 管理像素化和颜色匹配的并行处理
 */

export interface PixelationWorkerMessage {
  type: 'pixelate';
  imageData: ImageData;
  imgWidth: number;
  imgHeight: number;
  N: number;
  M: number;
  palette: Array<{
    key: string;
    color: string;
    rgb: { l: number; a: number; b: number };
  }>;
  mode: 'dominant' | 'average';
  fallbackColorKey: string;
  startIndex: number;
  endIndex: number;
  workerIndex: number;
}

export interface PixelationWorkerResult {
  type: 'pixelate-result';
  workerIndex: number;
  result: Array<{ x: number; y: number; colorKey: string }>;
  error?: string;
}

/**
 * Web Worker管理器类
 */
export class WorkerManager {
  private workers: Worker[] = [];
  private workerCount: number;
  private workerUrl: string;

  constructor(workerUrl: string, workerCount: number = 4) {
    this.workerUrl = workerUrl;
    this.workerCount = Math.min(workerCount, navigator.hardwareConcurrency || 4);
  }

  /**
   * 初始化Workers
   */
  async initialize(): Promise<void> {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(this.workerUrl);
      this.workers.push(worker);
    }
  }

  /**
   * 并行像素化
   */
  async parallelPixelate(
    imageData: ImageData,
    imgWidth: number,
    imgHeight: number,
    N: number,
    M: number,
    palette: Array<{
      key: string;
      color: string;
      rgb: { l: number; a: number; b: number };
    }>,
    mode: 'dominant' | 'average',
    fallbackColorKey: string
  ): Promise<string[][]> {
    const chunkHeight = Math.ceil(M / this.workerCount);
    const promises: Promise<PixelationWorkerResult>[] = [];

    // 分配任务给Workers
    for (let i = 0; i < this.workerCount; i++) {
      const startIndex = i * chunkHeight;
      const endIndex = Math.min((i + 1) * chunkHeight, M);

      if (startIndex >= M) break;

      const message: PixelationWorkerMessage = {
        type: 'pixelate',
        imageData,
        imgWidth,
        imgHeight,
        N,
        M,
        palette,
        mode,
        fallbackColorKey,
        startIndex,
        endIndex,
        workerIndex: i
      };

      const promise = new Promise<PixelationWorkerResult>((resolve) => {
        const worker = this.workers[i];

        const handler = (e: MessageEvent<PixelationWorkerResult>) => {
          if (e.data.workerIndex === i) {
            worker.removeEventListener('message', handler);
            resolve(e.data);
          }
        };

        worker.addEventListener('message', handler);
        worker.postMessage(message);
      });

      promises.push(promise);
    }

    // 等待所有Workers完成
    const results = await Promise.all(promises);

    // 合并结果
    const grid: string[][] = Array(M).fill(null).map(() => Array(N).fill('TRANSPARENT'));

    for (const result of results) {
      if (result.error) {
        console.error(`Worker ${result.workerIndex} 错误:`, result.error);
        continue;
      }

      for (const pixel of result.result) {
        grid[pixel.y][pixel.x] = pixel.colorKey;
      }
    }

    return grid;
  }

  /**
   * 清理Workers
   */
  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
  }

  /**
   * 获取Worker数量
   */
  getWorkerCount(): number {
    return this.workerCount;
  }
}

/**
 * 创建Worker管理器
 */
export function createWorkerManager(
  workerPath: string,
  workerCount?: number
): WorkerManager {
  // 转换为Blob URL（用于内联Worker）
  if (workerPath.startsWith('data:') || workerPath.startsWith('blob:')) {
    return new WorkerManager(workerPath, workerCount);
  }

  // 对于相对路径，转换为完整URL
  const fullUrl = new URL(workerPath, window.location.href).href;
  return new WorkerManager(fullUrl, workerCount);
}

/**
 * 从代码字符串创建Worker
 */
export function createWorkerFromCode(code: string): Worker {
  const blob = new Blob([code], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}