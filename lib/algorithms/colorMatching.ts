/**
 * 颜色匹配算法
 * 将图像像素映射到品牌调色板
 */

import type { RgbColor, BrandId } from '@/types';
import { rgbToOklab, calculateDeltaE } from '@/lib/utils/colorUtils';

export interface ColorMatchResult {
  mappedGrid: string[][];
  colorCounts: Map<string, number>;
  excludedColors: Set<string>;
  totalPixels: number;
  uniqueColors: number;
  averageConfidence: number;
  maxDistance: number;
}

export interface PaletteColor {
  key: string;
  color: string;
  rgb: { l: number; a: number; b: number };
  brand: BrandId;
  code: string;
  name: string;
  hex: string;
}

/**
 * 将图像数据映射到品牌调色板
 * @param imageData 图像数据
 * @param width 图像宽度
 * @param height 图像高度
 * @param N 横向格子数
 * @param M 纵向格子数
 * @param palette 当前调色板
 * @param excludedColors 排除的颜色集合
 * @returns 映射结果
 */
export function matchColorsToPalette(
  imageData: ImageData,
  width: number,
  height: number,
  N: number,
  M: number,
  palette: PaletteColor[],
  excludedColors: Set<string> = new Set()
): ColorMatchResult {
  const mappedGrid: string[][] = Array(M).fill(null).map(() => Array(N).fill('TRANSPARENT'));
  const colorCounts = new Map<string, number>();
  let totalPixels = 0;
  let totalConfidence = 0;
  let maxDistance = 0;

  const cellWidthOriginal = width / N;
  const cellHeightOriginal = height / M;

  // 处理每个单元格
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const startXOriginal = Math.floor(i * cellWidthOriginal);
      const startYOriginal = Math.floor(j * cellHeightOriginal);
      const endXOriginal = Math.min(width, Math.ceil((i + 1) * cellWidthOriginal));
      const endYOriginal = Math.min(height, Math.ceil((j + 1) * cellHeightOriginal));

      // 计算单元格的实际宽高
      const currentCellWidth = Math.max(1, endXOriginal - startXOriginal);
      const currentCellHeight = Math.max(1, endYOriginal - startYOriginal);

      // 提取代表色（取主均值）
      let sumR = 0, sumG = 0, sumB = 0, pixelCount = 0;
      const colorCountsInCell: { [key: string]: number } = {};

      for (let y = startYOriginal; y < endYOriginal; y++) {
        for (let x = startXOriginal; x < endXOriginal; x++) {
          const index = (y * width + x) * 4;

          // 检查 alpha 通道
          const a = imageData.data[index + 3];
          if (a < 128) continue;

          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];

          pixelCount++;

          // 颜色量化（降低精度，减少颜色数量）
          const rQuantized = Math.round(r / 4) * 4;
          const gQuantized = Math.round(g / 4) * 4;
          const bQuantized = Math.round(b / 4) * 4;

          const colorKey = `${rQuantized},${gQuantized},${bQuantized}`;
          colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;

          sumR += r;
          sumG += g;
          sumB += b;
        }
      }

      // 找到出现次数最多的颜色（主色）
      let maxCount = 0;
      let bestR = 0, bestG = 0, bestB = 0;

      if (pixelCount > 0) {
        // 使用主导色
        for (const [key, count] of Object.entries(colorCountsInCell)) {
          if (count > maxCount) {
            maxCount = count;
            const [r, g, b] = key.split(',').map(Number);
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }
      }

      if (maxCount > 0) {
        // 在调色板中找最接近的颜色
        const targetRgb = { r: bestR, g: bestG, b: bestB };
        const closestColor = findClosestColor(targetRgb, palette);

        if (closestColor && !excludedColors.has(closestColor.key)) {
          // 映射成功
          mappedGrid[j][i] = closestColor.key;
          colorCounts.set(closestColor.key, (colorCounts.get(closestColor.key) || 0) + 1);
          totalPixels++;

          // 计算置信度（基于颜色与调色板的接近程度）
          const confidence = calculateConfidence(
            { r: bestR, g: bestG, b: bestB },
            closestColor.rgb,
            palette
          );
          totalConfidence += confidence;

          // 计算颜色距离
          const distance = calculateDeltaE(
            rgbToOklab({ r: bestR, g: bestG, b: bestB }),
            closestColor.rgb
          );
          if (distance > maxDistance) {
            maxDistance = distance;
          }
        } else {
          // 未找到合适颜色，使用备用色
          mappedGrid[j][i] = 'TRANSPARENT';
        }
      } else {
        // 单元格内没有不透明像素
        mappedGrid[j][i] = 'TRANSPARENT';
      }
    }
  }

  // 计算统计数据
  const uniqueColors = colorCounts.size;
  const averageConfidence = totalPixels > 0 ? totalConfidence / totalPixels : 0;

  return {
    mappedGrid,
    colorCounts,
    excludedColors,
    totalPixels,
    uniqueColors,
    averageConfidence,
    maxDistance
  };
}

/**
 * 计算匹配置信度
 * @param target 目标颜色
 * @param actual 匹配结果颜色
 * @param palette 调色板
 * @returns 置信度（0-100）
 */
function calculateConfidence(
  target: RgbColor,
  actual: { l: number; a: number; b: number },
  palette: PaletteColor[]
): number {
  const targetLab = rgbToOklab(target);

  // 计算Delta E
  const deltaE = calculateDeltaE(targetLab, actual);

  // 基于最大DeltaE计算置信度
  const maxDelta = 80; // 假设最大可接受的DeltaE为80
  const confidence = Math.max(0, 100 - (deltaE / maxDelta) * 100);

  return confidence;
}

/**
 * 在调色板中找到最接近的颜色
 * @param targetColor 目标RGB
 * @param palette 调色板
 * @returns 最接近的颜色
 */
function findClosestColor(
  targetColor: RgbColor,
  palette: PaletteColor[]
): PaletteColor | null {
  if (palette.length === 0) {
    console.error("调色板为空，使用备用色");
    return null;
  }

  let minDistance = Infinity;
  let closestColor: PaletteColor | null = null;

  const targetLab = rgbToOklab(targetColor);

  for (const color of palette) {
    const distance = calculateDeltaE(targetLab, color.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }

    // 如果找到完全匹配（距离为0），提前退出
    if (distance === 0) break;
  }

  return closestColor;
}

/**
 * 重新映射被排除的颜色
 * @param grid 当前网格数据
 * @param excludedColors 排除的颜色键集合
 * @param fallbackKey 回退色号键
 * @returns 重映射后的网格数据
 */
export function remapExcludedColors(
  grid: string[][],
  excludedColors: Set<string>,
  fallbackKey: string = 'TRANSPARENT'
): string[][] {
  return grid.map(row =>
    row.map(cellKey =>
      excludedColors.has(cellKey) ? fallbackKey : cellKey
    )
  );
}

/**
 * 将十六进制颜色转换为RGB对象
 * @param hex 十六进制颜色字符串
 * @returns RGB对象
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } | null {
  const match = /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/i.exec(hex);
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
        a: 1
      }
    : null;
}

/**
 * 判断颜色是否为近似颜色
 * @param hex1 颜色1的hex值
 * @param hex2 颜色2的hex值
 * @param threshold 阈值（DeltaE，0-100）
 * @returns 是否相似
 */
export function isColorSimilar(
  hex1: string,
  hex2: string,
  threshold: number = 15
): boolean {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return false;

  const lab1 = rgbToOklab(rgb1);
  const lab2 = rgbToOklab(rgb2);

  return calculateDeltaE(lab1, lab2) < threshold;
}