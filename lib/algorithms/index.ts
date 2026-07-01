/**
 * 算法模块主入口
 */

export { pixelateImage } from './pixelation';
export {
  matchColorsToPalette,
  remapExcludedColors,
  hexToRgb,
  isColorSimilar,
  type ColorMatchResult
} from './colorMatching';
export {
  detectBackgroundColor,
  removeBackground,
  isBackgroundColor,
  addBackgroundColor,
  removeBackgroundColor
} from './backgroundRemoval';
export {
  mergeRegions,
  setAllPixelsToFallback,
  setExternalPixels,
  extractColorStats,
  filterByColors,
  calculateColorDifference
} from './regionMerge';
export {
  generatePurchaseList,
  generateMultiBrandPurchaseLists,
  findCheapestBrand,
  generatePurchaseAdvice,
  optimizePurchaseList,
  purchaseListToCSV,
  purchaseListToJSON,
  purchaseListToHTML,
  PACKAGE_SIZE,
  BRAND_PACKAGE_PRICES,
  type PurchaseListOptions,
  type OptimizationOptions,
  DEFAULT_PURCHASE_LIST_OPTIONS,
  DEFAULT_OPTIMIZATION_OPTIONS
} from './purchaseList';