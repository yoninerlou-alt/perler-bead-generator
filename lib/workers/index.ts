/**
 * Worker模块主入口
 */

export { WorkerManager, createWorkerManager, createWorkerFromCode } from './workerManager';
export type {
  PixelationWorkerMessage,
  PixelationWorkerResult
} from './pixelationWorker';