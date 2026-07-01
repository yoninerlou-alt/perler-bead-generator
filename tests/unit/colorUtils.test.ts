import { describe, it, expect } from 'vitest';
import type { RgbColor, OklabColor, HslColor } from '@/types';
import {
  hexToRgb,
  rgbToHex,
  rgbToOklab,
  oklabToRgb,
  rgbToHsl,
  hslToRgb,
  calculateDeltaE,
  calculateContrastRatio,
} from '@/lib/utils/colorUtils';

describe('ColorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert 3-digit hex to RGB', () => {
      const result = hexToRgb('#f00');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert 6-digit hex to RGB', () => {
      const result = hexToRgb('#ff0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert blue hex', () => {
      const result = hexToRgb('#0000ff');
      expect(result).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should convert green hex', () => {
      const result = hexToRgb('#00ff00');
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should convert white hex', () => {
      const result = hexToRgb('#ffffff');
      expect(result).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert black hex', () => {
      const result = hexToRgb('#000000');
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle mixed color hex', () => {
      const result = hexToRgb('#804020');
      expect(result).toEqual({ r: 128, g: 64, b: 32 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert red RGB to hex', () => {
      const result = rgbToHex({ r: 255, g: 0, b: 0 });
      expect(result).toBe('#ff0000');
    });

    it('should convert blue RGB to hex', () => {
      const result = rgbToHex({ r: 0, g: 0, b: 255 });
      expect(result).toBe('#0000ff');
    });

    it('should convert white RGB to hex', () => {
      const result = rgbToHex({ r: 255, g: 255, b: 255 });
      expect(result).toBe('#ffffff');
    });

    it('should convert black RGB to hex', () => {
      const result = rgbToHex({ r: 0, g: 0, b: 0 });
      expect(result).toBe('#000000');
    });

    it('should convert mixed RGB to hex', () => {
      const result = rgbToHex({ r: 128, g: 64, b: 32 });
      expect(result).toBe('#804020');
    });
  });

  describe('rgbToOklab', () => {
    it('should convert red RGB to OKLab', () => {
      const rgb: RgbColor = { r: 255, g: 0, b: 0 };
      const result = rgbToOklab(rgb);

      expect(result.l).toBeGreaterThanOrEqual(0);
      expect(result.l).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('a');
      expect(result).toHaveProperty('b');
    });

    it('should convert blue RGB to OKLab', () => {
      const rgb: RgbColor = { r: 0, g: 0, b: 255 };
      const result = rgbToOklab(rgb);

      expect(result.l).toBeGreaterThanOrEqual(0);
      expect(result.l).toBeLessThanOrEqual(100);
      expect(result.b).toBeLessThan(0);
    });

    it('should convert green RGB to OKLab', () => {
      const rgb: RgbColor = { r: 0, g: 255, b: 0 };
      const result = rgbToOklab(rgb);

      expect(result.l).toBeGreaterThanOrEqual(0);
      expect(result.l).toBeLessThanOrEqual(100);
      expect(result.a).toBeLessThan(0);
    });

    it('should convert white RGB to OKLab', () => {
      const rgb: RgbColor = { r: 255, g: 255, b: 255 };
      const result = rgbToOklab(rgb);

      expect(result.l).toBe(100);
      expect(result.a).toBeCloseTo(0, 1);
      expect(result.b).toBeCloseTo(0, 1);
    });

    it('should convert black RGB to OKLab', () => {
      const rgb: RgbColor = { r: 0, g: 0, b: 0 };
      const result = rgbToOklab(rgb);

      expect(result.l).toBe(0);
      expect(result.a).toBeCloseTo(0, 1);
      expect(result.b).toBeCloseTo(0, 1);
    });

    it('should convert gray RGB to OKLab', () => {
      const rgb: RgbColor = { r: 128, g: 128, b: 128 };
      const result = rgbToOklab(rgb);

      expect(result.l).toBeGreaterThan(0);
      expect(result.l).toBeLessThan(100);
      expect(result.a).toBeCloseTo(0, 1);
      expect(result.b).toBeCloseTo(0, 1);
    });
  });

  describe('oklabToRgb', () => {
    it('should convert OKLab back to RGB', () => {
      const oklab: OklabColor = { l: 50, a: 10, b: 20 };
      const result = oklabToRgb(oklab);

      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it('should convert black OKLab to RGB', () => {
      const oklab: OklabColor = { l: 0, a: 0, b: 0 };
      const result = oklabToRgb(oklab);

      expect(result.r).toBeCloseTo(0, 0);
      expect(result.g).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    it('should convert white OKLab to RGB', () => {
      const oklab: OklabColor = { l: 100, a: 0, b: 0 };
      const result = oklabToRgb(oklab);

      expect(result.r).toBeCloseTo(255, 0);
      expect(result.g).toBeCloseTo(255, 0);
      expect(result.b).toBeCloseTo(255, 0);
    });

    it('should handle negative a and b values', () => {
      const oklab: OklabColor = { l: 50, a: -20, b: -30 };
      const result = oklabToRgb(oklab);

      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
    });
  });

  describe('rgbToHsl', () => {
    it('should convert red RGB to HSL', () => {
      const rgb: RgbColor = { r: 255, g: 0, b: 0 };
      const result = rgbToHsl(rgb);

      expect(result.h).toBeCloseTo(0, 1);
      expect(result.s).toBeCloseTo(100, 0);
      expect(result.l).toBeCloseTo(50, 0);
    });

    it('should convert green RGB to HSL', () => {
      const rgb: RgbColor = { r: 0, g: 255, b: 0 };
      const result = rgbToHsl(rgb);

      expect(result.h).toBeCloseTo(120, 1);
      expect(result.s).toBeCloseTo(100, 0);
      expect(result.l).toBeCloseTo(50, 0);
    });

    it('should convert blue RGB to HSL', () => {
      const rgb: RgbColor = { r: 0, g: 0, b: 255 };
      const result = rgbToHsl(rgb);

      expect(result.h).toBeCloseTo(240, 1);
      expect(result.s).toBeCloseTo(100, 0);
      expect(result.l).toBeCloseTo(50, 0);
    });

    it('should convert white RGB to HSL', () => {
      const rgb: RgbColor = { r: 255, g: 255, b: 255 };
      const result = rgbToHsl(rgb);

      expect(result.l).toBe(100);
      expect(result.s).toBe(0);
    });

    it('should convert black RGB to HSL', () => {
      const rgb: RgbColor = { r: 0, g: 0, b: 0 };
      const result = rgbToHsl(rgb);

      expect(result.l).toBe(0);
      expect(result.s).toBe(0);
    });

    it('should convert gray RGB to HSL', () => {
      const rgb: RgbColor = { r: 128, g: 128, b: 128 };
      const result = rgbToHsl(rgb);

      expect(result.s).toBe(0);
      expect(result.l).toBeCloseTo(50, 0);
    });
  });

  describe('hslToRgb', () => {
    it('should convert red HSL to RGB', () => {
      const hsl: HslColor = { h: 0, s: 100, l: 50 };
      const result = hslToRgb(hsl);

      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should convert green HSL to RGB', () => {
      const hsl: HslColor = { h: 120, s: 100, l: 50 };
      const result = hslToRgb(hsl);

      expect(result.r).toBe(0);
      expect(result.g).toBe(255);
      expect(result.b).toBe(0);
    });

    it('should convert blue HSL to RGB', () => {
      const hsl: HslColor = { h: 240, s: 100, l: 50 };
      const result = hslToRgb(hsl);

      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(255);
    });

    it('should convert white HSL to RGB', () => {
      const hsl: HslColor = { h: 0, s: 0, l: 100 };
      const result = hslToRgb(hsl);

      expect(result.r).toBe(255);
      expect(result.g).toBe(255);
      expect(result.b).toBe(255);
    });

    it('should convert black HSL to RGB', () => {
      const hsl: HslColor = { h: 0, s: 0, l: 0 };
      const result = hslToRgb(hsl);

      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should handle hue wrapping at 360', () => {
      const hsl: HslColor = { h: 360, s: 100, l: 50 };
      const result = hslToRgb(hsl);

      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });
  });

  describe('calculateDeltaE', () => {
    it('should return 0 for identical colors', () => {
      const color1: OklabColor = { l: 50, a: 10, b: 20 };
      const color2: OklabColor = { l: 50, a: 10, b: 20 };

      const result = calculateDeltaE(color1, color2);
      expect(result).toBe(0);
    });

    it('should return positive value for different colors', () => {
      const color1: OklabColor = { l: 50, a: 10, b: 20 };
      const color2: OklabColor = { l: 60, a: 20, b: 30 };

      const result = calculateDeltaE(color1, color2);
      expect(result).toBeGreaterThan(0);
    });

    it('should calculate distance correctly', () => {
      const color1: OklabColor = { l: 0, a: 0, b: 0 };
      const color2: OklabColor = { l: 10, a: 0, b: 0 };

      const result = calculateDeltaE(color1, color2);
      expect(result).toBeCloseTo(10, 5);
    });

    it('should handle extreme color differences', () => {
      const color1: OklabColor = { l: 0, a: 0, b: 0 };
      const color2: OklabColor = { l: 100, a: 50, b: 50 };

      const result = calculateDeltaE(color1, color2);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(200);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate contrast for black on white', () => {
      const foreground = '#000000';
      const background = '#ffffff';

      const result = calculateContrastRatio(foreground, background);
      expect(result).toBeCloseTo(21, 0);
    });

    it('should calculate contrast for white on black', () => {
      const foreground = '#ffffff';
      const background = '#000000';

      const result = calculateContrastRatio(foreground, background);
      expect(result).toBeCloseTo(21, 0);
    });

    it('should calculate contrast for gray on white', () => {
      const foreground = '#808080';
      const background = '#ffffff';

      const result = calculateContrastRatio(foreground, background);
      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(21);
    });

    it('should calculate contrast for similar colors', () => {
      const foreground = '#ffffff';
      const background = '#f0f0f0';

      const result = calculateContrastRatio(foreground, background);
      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(2);
    });

    it('should calculate contrast for red on white', () => {
      const foreground = '#ff0000';
      const background = '#ffffff';

      const result = calculateContrastRatio(foreground, background);
      expect(result).toBeGreaterThan(1);
    });
  });
});