import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RgbColor, BrandId } from '@/types';
import { rgbToOklab, calculateDeltaE } from '@/lib/utils/colorUtils';
import { matchColorsToPalette, type PaletteColor } from '@/lib/algorithms/colorMatching';

// Mock ImageData
class MockImageData implements ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

// Mock global ImageData
global.ImageData = MockImageData as any;

describe('ColorMatching', () => {
  describe('calculateDeltaE', () => {
    it('should return 0 for identical colors', () => {
      const color1 = { l: 50, a: 10, b: 20 };
      const color2 = { l: 50, a: 10, b: 20 };

      const delta = calculateDeltaE(color1, color2);
      expect(delta).toBe(0);
    });

    it('should return positive value for different colors', () => {
      const color1 = { l: 50, a: 10, b: 20 };
      const color2 = { l: 60, a: 20, b: 30 };

      const delta = calculateDeltaE(color1, color2);
      expect(delta).toBeGreaterThan(0);
    });

    it('should handle extreme color differences', () => {
      const color1 = { l: 0, a: 0, b: 0 };
      const color2 = { l: 100, a: 50, b: 50 };

      const delta = calculateDeltaE(color1, color2);
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeLessThan(200); // Delta E max theoretical value
    });
  });

  describe('rgbToOklab', () => {
    it('should convert RGB to OKLab', () => {
      const rgb: RgbColor = { r: 128, g: 128, b: 128 };

      const oklab = rgbToOklab(rgb);
      expect(oklab).toHaveProperty('l');
      expect(oklab).toHaveProperty('a');
      expect(oklab).toHaveProperty('b');
    });

    it('should handle black', () => {
      const rgb: RgbColor = { r: 0, g: 0, b: 0 };

      const oklab = rgbToOklab(rgb);
      expect(oklab.l).toBe(0);
    });

    it('should handle white', () => {
      const rgb: RgbColor = { r: 255, g: 255, b: 255 };

      const oklab = rgbToOklab(rgb);
      expect(oklab.l).toBe(100);
    });

    it('should handle red', () => {
      const rgb: RgbColor = { r: 255, g: 0, b: 0 };

      const oklab = rgbToOklab(rgb);
      expect(oklab.l).toBeGreaterThan(0);
    });
  });

  describe('matchColorsToPalette', () => {
    let palette: PaletteColor[];

    beforeEach(() => {
      palette = [
        {
          key: 'red',
          color: 'red',
          rgb: { l: 50, a: 20, b: 10 },
          brand: 'perler',
          code: 'RED01',
          name: 'Red',
          hex: '#FF0000',
        },
        {
          key: 'blue',
          color: 'blue',
          rgb: { l: 50, a: -20, b: -30 },
          brand: 'perler',
          code: 'BLU01',
          name: 'Blue',
          hex: '#0000FF',
        },
        {
          key: 'green',
          color: 'green',
          rgb: { l: 50, a: -20, b: 10 },
          brand: 'perler',
          code: 'GRN01',
          name: 'Green',
          hex: '#00FF00',
        },
      ];
    });

    it('should map image data to palette colors', () => {
      const imageData = new MockImageData(3, 3);
      // Set red pixels
      for (let i = 0; i < 3; i++) {
        imageData.data[i * 4] = 255;
        imageData.data[i * 4 + 1] = 0;
        imageData.data[i * 4 + 2] = 0;
        imageData.data[i * 4 + 3] = 255;
      }

      const result = matchColorsToPalette(imageData, 3, 3, 1, 1, palette);

      expect(result).toHaveProperty('mappedGrid');
      expect(result).toHaveProperty('colorCounts');
      expect(result).toHaveProperty('totalPixels');
      expect(result).toHaveProperty('uniqueColors');
    });

    it('should count colors correctly', () => {
      const imageData = new MockImageData(3, 3);
      imageData.data[0] = 255; // red
      imageData.data[1] = 0;
      imageData.data[2] = 0;
      imageData.data[3] = 255;

      const result = matchColorsToPalette(imageData, 3, 3, 1, 1, palette);

      expect(result.colorCounts.size).toBeGreaterThan(0);
    });

    it('should handle empty image data', () => {
      const imageData = new MockImageData(0, 0);

      const result = matchColorsToPalette(imageData, 0, 0, 1, 1, palette);

      expect(result.mappedGrid).toBeDefined();
      expect(result.totalPixels).toBe(0);
    });

    it('should respect excluded colors', () => {
      const excludedColors = new Set(['red']);

      const imageData = new MockImageData(1, 1);
      imageData.data[0] = 255;
      imageData.data[1] = 0;
      imageData.data[2] = 0;
      imageData.data[3] = 255;

      const result = matchColorsToPalette(
        imageData,
        1,
        1,
        1,
        1,
        palette,
        excludedColors
      );

      expect(result.excludedColors.size).toBeGreaterThan(0);
    });

    it('should calculate confidence metrics', () => {
      const imageData = new MockImageData(3, 3);

      const result = matchColorsToPalette(imageData, 3, 3, 1, 1, palette);

      expect(result.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(result.maxDistance).toBeGreaterThanOrEqual(0);
    });
  });
});