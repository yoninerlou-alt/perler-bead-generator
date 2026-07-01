/**
 * 像素化算法
 * 支持主导色模式（避免灰色毛边）和平均色模式（更好渐变）
 */

import type { PixelationMode, RgbColor } from '@/types';
import { calculateDeltaE } from '@/lib/utils/colorUtils';

/**
 * 单元格的像素数据（未映射）
 */
interface UnmappedPixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface PaletteColor {
  key: string;
  color: string;
  rgb: { l: number; a: number; b: number } | RgbColor;
}

/**
 * 计算单元格的代表色
 * @param imageData 图像数据
 * @param startX X起始坐标
 * @param startY Y起始坐标
 * @param width 单元格宽度
 * @param height 单元格高度
 * @param mode 像素化模式
 */
function calculateCellRepresentativeColor(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number,
  mode: PixelationMode
): RgbColor | null {
  const data = imageData.data;
  const imgWidth = imageData.width;
  let pixelCount = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  const colorCounts: { [key: string]: number } = {};

  // 遍历单元格内的每个像素
  const endY = Math.min(startY + height, imageData.height);
  const endX = Math.min(startX + width, imageData.width);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * imgWidth + x) * 4;

      // 检查 alpha 通道，忽略透明或半透明像素
      if (data[index + 3] < 128) {
        continue;
      }

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      if (mode === 'average') {
        // 平均色模式：累加所有像素
        sumR += r;
        sumG += g;
        sumB += b;
        pixelCount++;
      } else {
        // 主导色模式：统计颜色出现次数
        const colorKey = `${r},${g},${b}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        pixelCount++;
      }
    }
  }

  if (pixelCount === 0) {
    return null; // 区域内没有不透明像素
  }

  if (mode === 'average') {
    // 平均色模式：计算平均值
    return {
      r: Math.round(sumR / pixelCount),
      g: Math.round(sumG / pixelCount),
      b: Math.round(sumB / pixelCount)
    };
  } else {
    // 主导色模式：找出出现次数最多的颜色
    let maxCount = 0;
    let dominantColor: RgbColor | null = null;

    for (const [key, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = key.split(',').map(Number);
        dominantColor = { r, g, b };
      }
    }

    return dominantColor;
  }
}

/**
 * 图像像素化
 * @param originalCtx 原始图像的 Canvas 2D Context
 * @param imgWidth 原始图像宽度
 * @param imgHeight 原始图像高度
 * @param N 横向格子数
 * @param M 纵向格子数
 * @param palette 当前可用的调色板
 * @param mode 像素化模式
 * @param fallbackColor 备用颜色
 * @returns 像素化后的网格数据
 */
export function pixelateImage(
  originalCtx: CanvasRenderingContext2D,
  imgWidth: number,
  imgHeight: number,
  N: number,
  M: number,
  palette: PaletteColor[],
  mode: PixelationMode,
  fallbackColor: PaletteColor
): string[][] {
  console.log(`开始像素化: ${N}x${M} 格式, 模式: ${mode}`);

  // 创建 N x M 的网格
  const grid: string[][] = Array(M).fill(null).map(() => Array(N).fill(fallbackColor.key));

  // 计算单元格的实际宽高
  const cellWidthOriginal = imgWidth / N;
  const cellHeightOriginal = imgHeight / M;

  // 获取完整的图像数据
  let fullImageData: ImageData | null = null;
  try {
    fullImageData = originalCtx.getImageData(0, 0, imgWidth, imgHeight);
  } catch (e) {
    console.error("无法获取图像数据:", e);
    // 如果无法获取图像数据，使用简化的像素化方法
    // 这里会使用简化的方法，但能保证基础功能
  }

  if (!fullImageData) {
    return grid.map(row => row.map(cell => cell === fallbackColor.key ? fallbackColor.color : fallbackColor.key));
  }

  // 处理每个单元格
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const startXOriginal = Math.floor(i * cellWidthOriginal);
      const startYOriginal = Math.floor(j * cellHeightOriginal);

      // 计算实际单元格宽高
      const currentCellWidth = Math.max(1, Math.ceil(cellWidthOriginal));
      const currentCellHeight = Math.max(1, Math.ceil(cellHeightOriginal));

      const endXOriginal = Math.min(imgWidth, Math.ceil((i + 1) * cellWidthOriginal));
      const endYOriginal = Math.min(imgHeight, Math.ceil((j + 1) * cellHeightOriginal));

      // 提取代表色
      const representativeColor = calculateCellRepresentativeColor(
        fullImageData,
        startXOriginal,
        startYOriginal,
        currentCellWidth,
        currentCellHeight,
        mode
      );

      if (representativeColor) {
        // 在调色板中找到最接近的颜色
        const closestColor = findClosestColor(representativeColor, palette);
        if (closestColor) {
          grid[j][i] = closestColor.key;
        } else {
          grid[j][i] = fallbackColor.key;
        }
      } else {
        grid[j][i] = 'TRANSPARENT';
      }
    }
  }

  return grid;
}

/**
 * 查找调色板中最近的颜色
 * @param targetColor 目标RGB颜色
 * @param palette 调色板
 * @returns 最接近的颜色
 */
function findClosestColor(
  targetColor: RgbColor,
  palette: PaletteColor[]
): PaletteColor | null {
  if (palette.length === 0) {
    console.error("调色板为空");
    return null;
  }

  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const color of palette) {
    // 根据palette中rgb的类型处理
    const colorRgb = 'l' in color.rgb ? color.rgb : convertToLab(color.rgb);
    const targetLab = convertToLab(targetColor);

    const distance = calculateDeltaE(targetLab, colorRgb);

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }

    // 如果找到完全匹配（距离为0），提前退出
    if (minDistance === 0) break;
  }

  return closestColor;
}

/**
 * 转换为Lab颜色空间
 */
function convertToLab(rgb: RgbColor): { l: number; a: number; b: number } {
  return rgbToOklab(rgb);
}

/**
 * 计算CIELAB值（从RGB）
 * 这是比RGB更准确的色彩空间
 */
function rgbToOklab(rgb: RgbColor): { l: number; a: number; b: number; } {
  // 标准化到 [0, 1]
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const bBlue = rgb.b / 255;

  // sRGB → Linear RGB
  const toLinear = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const linearR = toLinear(r);
  const linearG = toLinear(g);
  const linearB = toLinear(bBlue);

  // Linear RGB → XYZ
  const x = 0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB;
  const y = 0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB;
  const z = 0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB;

  // XYZ → Linear RGB
  const lRoot = Math.cbrt(x);
  const mRoot = Math.cbrt(y);
  const sRoot = Math.cbrt(z);

  const lRootValue = lRoot / Math.cbrt(0.9642) * 116;
  const mRootValue = mRoot / Math.cbrt(0.825) * 100;
  const sRootValue = sRoot / Math.cbrt(0.787) * 100;

  // Linear RGB → Lab
  const l = 0.2104542553 * lRootValue + 0.7936177850 * mRootValue - 0.0040720468 * sRootValue;
  const a = 1.9779984951 * lRootValue - 2.4285922050 * mRootValue + 0.4505937099 * sRootValue;
  const b = 0.0259040371 * lRootValue + 0.7827717662 * mRootValue - 0.8086757660 * sRootValue;

  return { l, a, b };
}