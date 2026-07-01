/**
 * AI智能配色
 * 使用色彩和谐理论生成配色方案
 */

import type { ColorData, BrandId, ColorCategory } from '@/types';
import { rgbToOklab, calculateDeltaE } from '@/lib/utils/colorUtils';

/**
 * 色彩和谐类型
 */
export type HarmonyType =
  | 'monochromatic'      // 单色系
  | 'analogous'          // 类似色
  | 'complementary'      // 互补色
  | 'split-complementary' // 分割互补
  | 'triadic'           // 三色配色
  | 'tetradic'          // 四色配色
  | 'analogous-complementary' // 类似+互补
  | 'square';           // 方形配色

/**
 * HSL颜色
 */
export interface HslColor {
  h: number;  // 色相 (0-360)
  s: number;  // 饱和度 (0-100)
  l: number;  // 亮度 (0-100)
  a?: number; // 透明度 (0-1)
}

/**
 * 配色方案
 */
export interface ColorHarmony {
  type: HarmonyType;
  baseColor: ColorData;
  colors: ColorData[];
  description: string;
}

/**
 * RGB转HSL
 */
export function rgbToHsl(rgb: { r: number; g: number; b: number; a?: number }): HslColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * HSL转RGB
 */
export function hslToRgb(hsl: HslColor): { r: number; g: number; b: number; a: number } {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a ?? 1
  };
}

/**
 * 找到最接近的颜色
 */
function findClosestColor(
  targetRgb: { r: number; g: number; b: number },
  palette: ColorData[]
): ColorData | null {
  if (palette.length === 0) return null;

  let minDistance = Infinity;
  let closestColor = palette[0];

  const targetLab = rgbToOklab(targetRgb);

  for (const color of palette) {
    const colorLab = rgbToOklab({ r: color.rgb[0], g: color.rgb[1], b: color.rgb[2] });
    const distance = calculateDeltaE(targetLab, colorLab);

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }

    if (distance === 0) break;
  }

  return closestColor;
}

/**
 * 生成单色系配色
 */
export function generateMonochromaticHarmony(
  baseColor: ColorData,
  palette: ColorData[],
  steps: number = 5
): ColorHarmony {
  const baseHsl = rgbToHsl({ r: baseColor.rgb[0], g: baseColor.rgb[1], b: baseColor.rgb[2] });

  const colors: ColorData[] = [baseColor];

  // 生成不同亮度的颜色
  const lightnessSteps = [10, 30, 50, 70, 90];

  for (let i = 0; i < steps; i++) {
    const l = lightnessSteps[i];
    const hsl: HslColor = { h: baseHsl.h, s: baseHsl.s, l };

    const rgb = hslToRgb(hsl);
    const closestColor = findClosestColor(rgb, palette);

    if (closestColor && closestColor.id !== baseColor.id) {
      colors.push(closestColor);
    }
  }

  return {
    type: 'monochromatic',
    baseColor,
    colors,
    description: '单色系：使用同一色相，不同亮度的颜色'
  };
}

/**
 * 生成类似色配色
 */
export function generateAnalogousHarmony(
  baseColor: ColorData,
  palette: ColorData[],
  steps: number = 3
): ColorHarmony {
  const baseHsl = rgbToHsl({ r: baseColor.rgb[0], g: baseColor.rgb[1], b: baseColor.rgb[2] });

  const colors: ColorData[] = [baseColor];
  const hueOffsets = [-30, 30];  // 类似色通常相差30度

  for (const offset of hueOffsets) {
    let h = (baseHsl.h + offset + 360) % 360;
    const hsl: HslColor = { h, s: baseHsl.s, l: baseHsl.l };

    const rgb = hslToRgb(hsl);
    const closestColor = findClosestColor(rgb, palette);

    if (closestColor && closestColor.id !== baseColor.id) {
      colors.push(closestColor);
    }
  }

  return {
    type: 'analogous',
    baseColor,
    colors,
    description: '类似色：使用色相相邻的颜色（如红色和橙色）'
  };
}

/**
 * 生成互补色配色
 */
export function generateComplementaryHarmony(
  baseColor: ColorData,
  palette: ColorData[]
): ColorHarmony {
  const baseHsl = rgbToHsl({ r: baseColor.rgb[0], g: baseColor.rgb[1], b: baseColor.rgb[2] });

  const colors: ColorData[] = [baseColor];
  const complementaryHue = (baseHsl.h + 180) % 360;

  const hsl: HslColor = { h: complementaryHue, s: baseHsl.s, l: baseHsl.l };
  const rgb = hslToRgb(hsl);
  const closestColor = findClosestColor(rgb, palette);

  if (closestColor) {
    colors.push(closestColor);
  }

  return {
    type: 'complementary',
    baseColor,
    colors,
    description: '互补色：使用色相相对的颜色（如红色和绿色）'
  };
}

/**
 * 生成三色配色
 */
export function generateTriadicHarmony(
  baseColor: ColorData,
  palette: ColorData[]
): ColorHarmony {
  const baseHsl = rgbToHsl({ r: baseColor.rgb[0], g: baseColor.rgb[1], b: baseColor.rgb[2] });

  const colors: ColorData[] = [baseColor];
  const hueOffsets = [120, 240];  // 三色配色相差120度

  for (const offset of hueOffsets) {
    let h = (baseHsl.h + offset) % 360;
    const hsl: HslColor = { h, s: baseHsl.s, l: baseHsl.l };

    const rgb = hslToRgb(hsl);
    const closestColor = findClosestColor(rgb, palette);

    if (closestColor) {
      colors.push(closestColor);
    }
  }

  return {
    type: 'triadic',
    baseColor,
    colors,
    description: '三色配色：使用色相间隔120度的三种颜色'
  };
}

/**
 * 生成四色配色（方形）
 */
export function generateTetradicHarmony(
  baseColor: ColorData,
  palette: ColorData[]
): ColorHarmony {
  const baseHsl = rgbToHsl({ r: baseColor.rgb[0], g: baseColor.rgb[1], b: baseColor.rgb[2] });

  const colors: ColorData[] = [baseColor];
  const hueOffsets = [90, 180, 270];  // 四色配色相差90度

  for (const offset of hueOffsets) {
    let h = (baseHsl.h + offset) % 360;
    const hsl: HslColor = { h, s: baseHsl.s, l: baseHsl.l };

    const rgb = hslToRgb(hsl);
    const closestColor = findClosestColor(rgb, palette);

    if (closestColor) {
      colors.push(closestColor);
    }
  }

  return {
    type: 'tetradic',
    baseColor,
    colors,
    description: '四色配色：使用色相间隔90度的四种颜色'
  };
}

/**
 * 根据类型生成配色方案
 */
export function generateColorHarmony(
  baseColor: ColorData,
  palette: ColorData[],
  type: HarmonyType
): ColorHarmony {
  switch (type) {
    case 'monochromatic':
      return generateMonochromaticHarmony(baseColor, palette);
    case 'analogous':
      return generateAnalogousHarmony(baseColor, palette);
    case 'complementary':
      return generateComplementaryHarmony(baseColor, palette);
    case 'triadic':
      return generateTriadicHarmony(baseColor, palette);
    case 'tetradic':
    case 'square':
      return generateTetradicHarmony(baseColor, palette);
    default:
      return generateAnalogousHarmony(baseColor, palette);
  }
}

/**
 * 推荐配色方案
 */
export function recommendHarmony(
  baseColor: ColorData,
  palette: ColorData[]
): ColorHarmony[] {
  const harmonies: ColorHarmony[] = [];

  // 单色系
  harmonies.push(generateMonochromaticHarmony(baseColor, palette));

  // 类似色
  harmonies.push(generateAnalogousHarmony(baseColor, palette));

  // 互补色
  harmonies.push(generateComplementaryHarmony(baseColor, palette));

  // 三色配色
  harmonies.push(generateTriadicHarmony(baseColor, palette));

  // 四色配色
  harmonies.push(generateTetradicHarmony(baseColor, palette));

  return harmonies;
}