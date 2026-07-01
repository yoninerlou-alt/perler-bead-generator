/**
 * 像素化工具
 */

import type { PixelationMode, GridDimensions, MappedPixel, BeadColor, RgbColor, LabColor } from '@/types/color';
import { deltaE2000 } from './colorUtils';

/**
 * 计算单元格的代表颜色（主导色模式）
 * 避免"灰色毛边"问题
 */
export function calculateCellRepresentativeColor(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number,
  mode: PixelationMode
): RgbColor | null {
  const blockPixels: RgbColor[] = [];

  // 提取单元格内的所有像素
  for (let y = startY; y < startY + height && y < imageData.height; y++) {
    for (let x = startX; x < startX + width && x < imageData.width; x++) {
      const idx = (y * imageData.width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];

      // 跳过透明像素
      if (a < 128) continue;

      blockPixels.push({ r, g, b });
    }
  }

  if (blockPixels.length === 0) {
    return null;
  }

  if (mode === 'dominant') {
    // 主导色：出现次数最多的颜色
    const colorCounts = new Map<string, number>();

    for (const pixel of blockPixels) {
      const key = `${pixel.r},${pixel.g},${pixel.b}`;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }

    let maxCount = 0;
    let dominantColor: RgbColor | null = null;

    for (const [key, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = key.split(',').map(Number);
        dominantColor = { r, g, b };
      }
    }

    return dominantColor;
  }

  if (mode === 'average') {
    // 平均色
    const sumR = blockPixels.reduce((sum, p) => sum + p.r, 0);
    const sumG = blockPixels.reduce((sum, p) => sum + p.g, 0);
    const sumB = blockPixels.reduce((sum, p) => sum + p.b, 0);

    return {
      r: Math.round(sumR / blockPixels.length),
      g: Math.round(sumG / blockPixels.length),
      b: Math.round(sumB / blockPixels.length)
    };
  }

  // 加权平均（可选）
  const weightedSumR = blockPixels.reduce((sum, p) => sum + p.r * (p.r + p.g + p.b), 0);
  const weightedSumG = blockPixels.reduce((sum, p) => sum + p.g * (p.r + p.g + p.b), 0);
  const weightedSumB = blockPixels.reduce((sum, p) => sum + p.b * (p.r + p.g + p.b), 0);
  const totalWeight = blockPixels.reduce((sum, p) => sum + p.r + p.g + p.b, 0);

  return {
    r: Math.round(weightedSumR / totalWeight),
    g: Math.round(weightedSumG / totalWeight),
    b: Math.round(weightedSumB / totalWeight)
  };
}

/**
 * 将图像转换为像素化网格
 */
export function pixelateImage(
  imageData: ImageData,
  pixelSize: number,
  mode: PixelationMode = 'dominant'
): MappedPixel[][] {
  const cols = Math.ceil(imageData.width / pixelSize);
  const rows = Math.ceil(imageData.height / pixelSize);

  const grid: MappedPixel[][] = [];

  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const startX = col * pixelSize;
      const startY = row * pixelSize;
      const rgb = calculateCellRepresentativeColor(
        imageData,
        startX,
        startY,
        Math.min(pixelSize, imageData.width - startX),
        Math.min(pixelSize, imageData.height - startY),
        mode
      );

      if (rgb) {
        grid[row][col] = {
          row,
          col,
          color: null,
          rgb,
          lab: rgbToLab(rgb),
          matchedColor: null,
          distance: 0
        };
      } else {
        grid[row][col] = {
          row,
          col,
          color: null,
          rgb: { r: 0, g: 0, b: 0 },
          lab: { l: 0, a: 0, b: 0 },
          matchedColor: null,
          distance: 0
        };
      }
    }
  }

  return grid;
}

/**
 * 将像素网格匹配到调色板颜色
 */
export function matchColorsToPalette(
  grid: MappedPixel[][],
  palette: BeadColor[],
  useLab: boolean = true
): MappedPixel[][] {
  // 预计算调色板的LAB值
  const paletteColors = palette.map(color => ({
    ...color,
    lab: useLab ? color.lab : rgbToLab(color.rgb)
  }));

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const pixel = grid[row][col];

      if (!pixel.rgb || (pixel.rgb.r === 0 && pixel.rgb.g === 0 && pixel.rgb.b === 0)) {
        continue;
      }

      let bestMatch: BeadColor | null = null;
      let bestDistance = Infinity;

      for (const paletteColor of paletteColors) {
        const distance = useLab
          ? deltaE2000(pixel.lab, paletteColor.lab)
          : rgbDistance(pixel.rgb, paletteColor.rgb);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = paletteColor;
        }
      }

      pixel.matchedColor = bestMatch;
      pixel.distance = bestDistance;
      pixel.color = bestMatch;
    }
  }

  return grid;
}

/**
 * RGB转CIELAB
 */
function rgbToLab(rgb: RgbColor): LabColor {
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

  const toXYZ = (c: number): number => {
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };

  const rn = toXYZ(r);
  const gn = toXYZ(g);
  const bn = toXYZ(b);

  const x = rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375;
  const y = rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750;
  const z = rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041;

  const toLab = (v: number, ref: number): number => {
    const v2 = v / ref;
    return v2 > 0.008856 ? Math.pow(v2, 1/3) : 7.787 * v2 + 16/116;
  };

  const L = 116 * toLab(y, 1.00000) - 16;
  const a = 500 * (toLab(x, 0.95047) - toLab(y, 1.00000));
  const labB = 200 * (toLab(y, 1.00000) - toLab(z, 1.08883));

  return {
    l: Math.round(L * 100) / 100,
    a: Math.round(a * 100) / 100,
    b: Math.round(labB * 100) / 100
  };
}

/**
 * RGB欧几里得距离
 */
function rgbDistance(rgb1: RgbColor, rgb2: RgbColor): number {
  const dr = rgb2.r - rgb1.r;
  const dg = rgb2.g - rgb1.g;
  const db = rgb2.b - rgb1.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 计算最优像素大小（基于目标珠子数量）
 */
export function calculateOptimalPixelSize(
  imageWidth: number,
  imageHeight: number,
  targetBeadCount: number
): number {
  const imageAspectRatio = imageWidth / imageHeight;
  const targetArea = targetBeadCount;
  const currentArea = imageWidth * imageHeight;
  const scaleFactor = Math.sqrt(targetArea / currentArea);

  const optimalPixelSize = Math.max(5, Math.round(1 / scaleFactor));

  return optimalPixelSize;
}

/**
 * 从图片文件创建ImageData
 */
export async function createImageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 从DataURL创建ImageData
 */
export function createImageDataFromDataURL(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}