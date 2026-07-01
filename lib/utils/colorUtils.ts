/**
 * 颜色工具函数（包含CIEDE2000和RGB转换）
 */

import type { RgbColor, LabColor } from '@/types/color';

/**
 * RGB归一化到0-1范围
 */
function normalizeRgb(r: number, g: number, b: number): [number, number, number] {
  return [r / 255, g / 255, b / 255];
}

/**
 * RGB转XYZ色彩空间
 */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const [rn, gn, bn] = normalizeRgb(r, g, b);

  const toXYZ = (c: number): number => {
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };

  const rnXYZ = toXYZ(rn);
  const gnXYZ = toXYZ(gn);
  const bnXYZ = toXYZ(bn);

  const x = rnXYZ * 0.4124564 + gnXYZ * 0.3575761 + bnXYZ * 0.1804375;
  const y = rnXYZ * 0.2126729 + gnXYZ * 0.7151522 + bnXYZ * 0.0721750;
  const z = rnXYZ * 0.0193339 + gnXYZ * 0.1191920 + bnXYZ * 0.9503041;

  return [x, y, z];
}

/**
 * XYZ转CIELAB色彩空间
 */
function xyzToLab(x: number, y: number, z: number): LabColor {
  const toLab = (v: number, ref: number): number => {
    const v2 = v / ref;
    return v2 > 0.008856 ? Math.pow(v2, 1/3) : 7.787 * v2 + 16/116;
  };

  const L = 116 * toLab(y, 1.00000) - 16;
  const a = 500 * (toLab(x, 0.95047) - toLab(y, 1.00000));
  const b = 200 * (toLab(y, 1.00000) - toLab(z, 1.08883));

  return {
    l: Math.round(L * 100) / 100,
    a: Math.round(a * 100) / 100,
    b: Math.round(b * 100) / 100
  };
}

/**
 * RGB转CIELAB
 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

/**
 * RGB转CIELAB（从对象）
 */
export function rgbToLabFromObject(rgb: RgbColor): LabColor {
  return rgbToLab(rgb.r, rgb.g, rgb.b);
}

/**
 * RGB转HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${b.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * HEX转RGB
 */
export function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * CIEDE2000颜色距离计算
 * 这是更准确的感知颜色差异度量
 */
export function deltaE2000(lab1: LabColor, lab2: LabColor): number {
  const [L1, a1, b1] = [lab1.l, lab1.a, lab1.b];
  const [L2, a2, b2] = [lab2.l, lab2.a, lab2.b];

  const dL = L2 - L1;
  const da = a2 - a1;
  const db = b2 - b1;

  const Lm = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cm = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cm, 7) / (Math.pow(Cm, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const dCp = C2p - C1p;

  const hp1 = Math.atan2(b1, a1p) * 180 / Math.PI;
  const hp2 = Math.atan2(b2, a2p) * 180 / Math.PI;
  const hpm = (hp1 + hp2 + 360) % 360;

  const dHp = hp2 - hp1;
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin(dHp * Math.PI / 360 / 2);

  const T = 1 - 0.17 * Math.cos((hpm - 30) * Math.PI / 180) +
            0.24 * Math.cos(2 * hpm * Math.PI / 180) +
            0.32 * Math.cos((3 * hpm + 6) * Math.PI / 180) -
            0.20 * Math.cos((4 * hpm - 63) * Math.PI / 180);

  const SL = 1 + (0.015 * Math.pow(Lm - 50, 2)) / Math.sqrt(20 + Math.pow(Lm - 50, 2));
  const SC = 1 + 0.045 * Cm;
  const SH = 1 + 0.015 * Cm * T;

  const RT = -2 * Math.sin(60 * Math.PI / 180) * Math.exp(-Math.pow(hpm - 275, 2) / (25 * 25));

  const deltaE = Math.sqrt(
    Math.pow(dL / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dH / SH, 2) +
    RT * (dCp / SC) * (dH / SH)
  );

  return deltaE;
}

/**
 * 验证RGB值是否有效
 */
export function isValidRgb(rgb: RgbColor): boolean {
  return (
    rgb.r >= 0 && rgb.r <= 255 &&
    rgb.g >= 0 && rgb.g <= 255 &&
    rgb.b >= 0 && rgb.b <= 255
  );
}

/**
 * 验证HEX值是否有效
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * 计算颜色的亮度（用于判断对比色）
 */
export function calculateLightness(rgb: RgbColor): number {
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

/**
 * 判断颜色是否为亮色
 */
export function isLightColor(rgb: RgbColor, threshold: number = 128): boolean {
  return calculateLightness(rgb) > threshold;
}

/**
 * 判断颜色是否为暗色
 */
export function isDarkColor(rgb: RgbColor, threshold: number = 128): boolean {
  return calculateLightness(rgb) <= threshold;
}

/**
 * 计算颜色的对比度
 */
export function calculateContrast(rgb1: RgbColor, rgb2: RgbColor): number {
  const l1 = calculateLightness(rgb1);
  const l2 = calculateLightness(rgb2);
  const lighter = Math.max(l1, l2) + 0.05;
  const darker = Math.min(l1, l2) + 0.05;
  return lighter / darker;
}

/**
 * 获取对比色（黑色或白色）
 */
export function getContrastColor(rgb: RgbColor): string {
  const luma = calculateLightness(rgb) / 255;
  return luma > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * RGB转HSL
 */
export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl(rgb: RgbColor): HslColor {
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
 * OKLab颜色类型（与LabColor兼容）
 */
export type OklabColor = LabColor;

/**
 * RGB转OKLab（别名，使用CIELAB实现）
 */
export function rgbToOklab(rgb: RgbColor): OklabColor {
  return rgbToLabFromObject(rgb);
}

/**
 * RGB转OKLab（带参数）
 */
export function rgbToOklabParams(r: number, g: number, b: number): OklabColor {
  return rgbToLab(r, g, b);
}

/**
 * OKLab转RGB（需要反向计算）
 */
export function oklabToRgb(oklab: OklabColor): RgbColor {
  // 简化的反向转换
  const L = oklab.l;
  const a = oklab.a;
  const labB = oklab.b;

  // CIELAB到XYZ的反向变换
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - labB / 200;

  const x = fx > 0.206897 ? Math.pow(fx, 3) : (fx - 16/116) / 7.787;
  const y = L > 8 ? Math.pow((L + 16) / 116, 3) : L / 903.3;
  const z = fz > 0.206897 ? Math.pow(fz, 3) : (fz - 16/116) / 7.787;

  // XYZ到RGB
  const xR = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const yR = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const zR = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  const r = Math.max(0, Math.min(255, xR * 255));
  const g = Math.max(0, Math.min(255, yR * 255));
  const blue = Math.max(0, Math.min(255, zR * 255));

  return { r: Math.round(r), g: Math.round(g), b: Math.round(blue) };
}

/**
 * 计算Delta E（别名）
 */
export function calculateDeltaE(lab1: OklabColor, lab2: OklabColor): number {
  return deltaE2000(lab1, lab2);
}

/**
 * HSL转RGB
 */
export function hslToRgb(hsl: HslColor): RgbColor {
  let { h, s, l } = hsl;
  h /= 360;
  s /= 100;
  l /= 100;

  let r = 0, g = 0, b = 0;

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
    b: Math.round(b * 255)
  };
}

/**
 * 计算对比度比（用于WCAG可访问性）
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return 1;

  const l1 = calculateLightness(fg);
  const l2 = calculateLightness(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}