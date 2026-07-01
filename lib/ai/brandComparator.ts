/**
 * 品牌间颜色对比功能
 * 允许用户对比不同品牌的颜色，找到最佳匹配
 */

import type { BrandId, ColorData } from '@/types';
import { calculateDeltaE, rgbToOklab } from '@/lib/utils/colorUtils';

/**
 * 颜色匹配结果
 */
export interface ColorMatch {
  brand: BrandId;
  colorId: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  distance: number;      // Delta E距离
  matchScore: number;     // 匹配度 (0-100)
  purchaseUrl?: string;
  inStock?: boolean;
}

/**
 * 品牌对比结果
 */
export interface BrandComparisonResult {
  targetColor: {
    rgb: { r: number; g: number; b: number; a: number };
    hex: string;
  };
  matches: Map<BrandId, ColorMatch>;
  bestMatch: ColorMatch | null;
  recommendation: string;
}

/**
 * 找出所有品牌中最接近的颜色
 */
export function findBestColorMatchAcrossBrands(
  targetRgb: { r: number; g: number; b: number; a: number },
  brandColors: Map<BrandId, ColorData[]>
): BrandComparisonResult {
  const matches = new Map<BrandId, ColorMatch>();
  const targetHex = `#${targetRgb.r.toString(16).padStart(2, '0')}${targetRgb.g.toString(16).padStart(2, '0')}${targetRgb.b.toString(16).padStart(2, '0')}`.toUpperCase();
  const targetLab = rgbToOklab(targetRgb);
  let bestMatch: ColorMatch | null = null;

  for (const [brandId, colors] of brandColors.entries()) {
    if (colors.length === 0) continue;

    // 找到该品牌中最接近的颜色
    let minDistance = Infinity;
    let closestColor: ColorData | null = null;

    for (const color of colors) {
      const colorLab = rgbToOklab({ r: color.rgb[0], g: color.rgb[1], b: color.rgb[2] });
      const distance = calculateDeltaE(targetLab, colorLab);

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }

      if (distance === 0) break;
    }

    if (closestColor) {
      // 计算匹配度 (0-100)
      const maxDistance = 80; // 假设最大可接受距离
      const matchScore = Math.max(0, 100 - (minDistance / maxDistance) * 100);

      const match: ColorMatch = {
        brand: brandId,
        colorId: closestColor.id,
        colorCode: closestColor.code,
        colorName: closestColor.name,
        colorHex: closestColor.hex,
        distance: minDistance,
        matchScore,
        purchaseUrl: closestColor.purchaseUrl,
        inStock: !closestColor.discontinued
      };

      matches.set(brandId, match);

      // 更新最佳匹配
      if (!bestMatch || match.distance < bestMatch.distance) {
        bestMatch = match;
      }
    }
  }

  // 生成推荐
  const recommendation = generateRecommendation(matches, bestMatch);

  return {
    targetColor: {
      rgb: targetRgb,
      hex: targetHex
    },
    matches,
    bestMatch,
    recommendation
  };
}

/**
 * 生成推荐文本
 */
function generateRecommendation(
  matches: Map<BrandId, ColorMatch>,
  bestMatch: ColorMatch | null
): string {
  if (!bestMatch) {
    return '未找到合适的颜色匹配';
  }

  const recommendations: string[] = [];

  // 根据匹配度给出推荐
  if (bestMatch.matchScore >= 90) {
    recommendations.push(`推荐使用 ${bestMatch.brand.toUpperCase()} 品牌，颜色匹配度高达 ${bestMatch.matchScore.toFixed(1)}%`);
  } else if (bestMatch.matchScore >= 70) {
    recommendations.push(`${bestMatch.brand.toUpperCase()} 品牌提供较接近的颜色（${bestMatch.matchScore.toFixed(1)}%），可以使用`);
  } else {
    recommendations.push(`${bestMatch.brand.toUpperCase()} 品牌的颜色匹配度一般（${bestMatch.matchScore.toFixed(1)}%），可能需要混合色使用`);
  }

  // 检查是否有更好的替代选择
  for (const [brandId, match] of matches.entries()) {
    if (match !== bestMatch && match.matchScore > bestMatch.matchScore - 5) {
      recommendations.push(`备选：${brandId.toUpperCase()} 品牌 ${match.colorName} 也接近（${match.matchScore.toFixed(1)}%）`);
    }
  }

  // 库存状态提醒
  if (bestMatch.inStock === false) {
    recommendations.push(`⚠️ 注意：${bestMatch.brand.toUpperCase()} 的 ${bestMatch.colorName} 可能已停产`);
  }

  return recommendations.join('\n');
}

/**
 * 批量对比颜色
 */
export function batchCompareColors(
  targetColors: { r: number; g: number; b: number; a: number }[],
  brandColors: Map<BrandId, ColorData[]>
): Map<string, BrandComparisonResult> {
  const results = new Map<string, BrandComparisonResult>();

  for (const targetRgb of targetColors) {
    const key = `${targetRgb.r},${targetRgb.g},${targetRgb.b}`;
    const result = findBestColorMatchAcrossBrands(targetRgb, brandColors);
    results.set(key, result);
  }

  return results;
}

/**
 * 生成颜色对比表格数据
 */
export function generateColorComparisonTable(
  comparison: BrandComparisonResult
): Array<{
  brand: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  matchScore: string;
  distance: number;
  inStock: boolean;
  recommendation: string;
}> {
  const tableData: Array<{
    brand: string;
    colorCode: string;
    colorName: string;
    colorHex: string;
    matchScore: string;
    distance: number;
    inStock: boolean;
    recommendation: string;
  }> = [];

  for (const [brandId, match] of comparison.matches.entries()) {
    let rec = '可用';
    if (!match.inStock) {
      rec = '停产';
    } else if (match.matchScore < 70) {
      rec = '混合色';
    }

    tableData.push({
      brand: brandId.toUpperCase(),
      colorCode: match.colorCode,
      colorName: match.colorName,
      colorHex: match.colorHex,
      matchScore: `${match.matchScore.toFixed(1)}%`,
      distance: match.distance,
      inStock: match.inStock ?? true,
      recommendation: rec
    });
  }

  // 按匹配度排序
  tableData.sort((a, b) => b.matchScore.localeCompare(a.matchScore));

  return tableData;
}

/**
 * 计算品牌间的色号对应关系
 */
export function calculateBrandColorMapping(
  brandA: BrandId,
  brandB: BrandId,
  colorsA: ColorData[],
  colorsB: ColorData[]
): Map<string, string> {
  const mapping = new Map<string, string>();

  for (const colorA of colorsA) {
    const rgbA = { r: colorA.rgb[0], g: colorA.rgb[1], b: colorA.rgb[2] };
    let minDistance = Infinity;
    let bestMatch: ColorData | null = null;

    const labA = rgbToOklab(rgbA);

    for (const colorB of colorsB) {
      const rgbB = { r: colorB.rgb[0], g: colorB.rgb[1], b: colorB.rgb[2] };
      const labB = rgbToOklab(rgbB);
      const distance = calculateDeltaE(labA, labB);

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = colorB;
      }
    }

    if (bestMatch && minDistance < 15) {
      mapping.set(colorA.id, bestMatch.id);
    }
  }

  return mapping;
}

/**
 * 检查品牌间颜色差异分布
 */
export function analyzeColorDifferences(
  brandColors: Map<BrandId, ColorData[]>
): {
  totalColors: number;
  uniqueColors: Set<string>;
  commonColors: Set<string>;
  uniqueToBrand: Map<BrandId, Set<string>>;
} {
  const allHexes = new Set<string>();
  const hexCount = new Map<string, number>();
  const uniqueToBrand = new Map<BrandId, Set<string>>();

  for (const [brandId, colors] of brandColors.entries()) {
    const brandHexes = new Set<string>();

    for (const color of colors) {
      allHexes.add(color.hex.toLowerCase());
      brandHexes.add(color.hex.toLowerCase());

      const count = hexCount.get(color.hex.toLowerCase()) || 0;
      hexCount.set(color.hex.toLowerCase(), count + 1);
    }

    uniqueToBrand.set(brandId, brandHexes);
  }

  // 找出共用的颜色
  const commonColors = new Set<string>();
  for (const [hex, count] of hexCount.entries()) {
    if (count === brandColors.size) {
      commonColors.add(hex);
    }
  }

  // 找出每个品牌独有的颜色
  for (const [brandId, brandHexes] of uniqueToBrand.entries()) {
    const exclusive = new Set<string>();
    for (const hex of brandHexes) {
      if (hexCount.get(hex) === 1) {
        exclusive.add(hex);
      }
    }
    uniqueToBrand.set(brandId, exclusive);
  }

  return {
    totalColors: allHexes.size,
    uniqueColors: allHexes,
    commonColors,
    uniqueToBrand
  };
}