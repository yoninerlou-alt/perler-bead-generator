/**
 * AI模块主入口
 */

export {
  rgbToHsl,
  hslToRgb,
  generateMonochromaticHarmony,
  generateAnalogousHarmony,
  generateComplementaryHarmony,
  generateTriadicHarmony,
  generateTetradicHarmony,
  generateColorHarmony,
  recommendHarmony,
  type HarmonyType,
  type HslColor,
  type ColorHarmony
} from './colorHarmony';

export {
  findBestColorMatchAcrossBrands,
  batchCompareColors,
  generateColorComparisonTable,
  calculateBrandColorMapping,
  analyzeColorDifferences,
  type ColorMatch,
  type BrandComparisonResult
} from './brandComparator';