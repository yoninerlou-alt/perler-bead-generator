import { describe, it, expect, beforeEach } from 'vitest';
import type { RgbColor } from '@/types';
import { calculateDominantColor, calculateAverageColor } from '@/lib/algorithms/pixelation';

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

global.ImageData = MockImageData as any;

describe('Pixelation', () => {
  describe('calculateDominantColor', () => {
    it('should calculate dominant color from red pixels', () => {
      const imageData = new MockImageData(10, 10);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 255;
      }

      const result = calculateDominantColor(imageData, 0, 0, 10, 10);
      expect(result).toHaveProperty('r');
      expect(result).toHaveProperty('g');
      expect(result).toHaveProperty('b');
    });

    it('should handle blue dominant pixels', () => {
      const imageData = new MockImageData(10, 10);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 0;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 255;
        imageData.data[i + 3] = 255;
      }

      const result = calculateDominantColor(imageData, 0, 0, 10, 10);
      expect(result.b).toBe(255);
    });

    it('should handle mixed colors', () => {
      const imageData = new MockImageData(6, 6);
      const totalPixels = 6 * 6;

      for (let i = 0; i < totalPixels; i++) {
        const pixelIndex = i * 4;
        if (i < totalPixels / 2) {
          imageData.data[pixelIndex] = 255;
          imageData.data[pixelIndex + 1] = 0;
          imageData.data[pixelIndex + 2] = 0;
        } else {
          imageData.data[pixelIndex] = 0;
          imageData.data[pixelIndex + 1] = 0;
          imageData.data[pixelIndex + 2] = 255;
        }
        imageData.data[pixelIndex + 3] = 255;
      }

      const result = calculateDominantColor(imageData, 0, 0, 6, 6);
      expect(result).toBeDefined();
    });

    it('should handle grayscale pixels', () => {
      const imageData = new MockImageData(10, 10);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 128;
        imageData.data[i + 1] = 128;
        imageData.data[i + 2] = 128;
        imageData.data[i + 3] = 255;
      }

      const result = calculateDominantColor(imageData, 0, 0, 10, 10);
      expect(result.r).toBe(128);
      expect(result.g).toBe(128);
      expect(result.b).toBe(128);
    });

    it('should handle transparent pixels', () => {
      const imageData = new MockImageData(10, 10);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 0; // Transparent
      }

      const result = calculateDominantColor(imageData, 0, 0, 10, 10);
      expect(result).toBeDefined();
    });
  });

  describe('calculateAverageColor', () => {
    it('should calculate average of red pixels', () => {
      const imageData = new MockImageData(4, 4);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 255;
      }

      const result = calculateAverageColor(imageData, 0, 0, 4, 4);
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should calculate average of mixed colors', () => {
      const imageData = new MockImageData(4, 4);
      const pixelCount = 16;

      // Half red, half blue
      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        if (i < 8) {
          imageData.data[idx] = 255;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
        } else {
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 255;
        }
        imageData.data[idx + 3] = 255;
      }

      const result = calculateAverageColor(imageData, 0, 0, 4, 4);
      expect(result.r).toBe(Math.floor(255 / 2));
      expect(result.g).toBe(0);
      expect(result.b).toBe(Math.floor(255 / 2));
    });

    it('should handle single pixel', () => {
      const imageData = new MockImageData(1, 1);
      imageData.data[0] = 100;
      imageData.data[1] = 150;
      imageData.data[2] = 200;
      imageData.data[3] = 255;

      const result = calculateAverageColor(imageData, 0, 0, 1, 1);
      expect(result.r).toBe(100);
      expect(result.g).toBe(150);
      expect(result.b).toBe(200);
    });

    it('should handle transparent pixels by excluding them', () => {
      const imageData = new MockImageData(4, 4);
      const pixelCount = 16;

      // Set 3 pixels opaque, rest transparent
      const transparentCount = 13;
      const opaqueCount = 3;
      const totalR = 255 + 200 + 150;

      for (let i = 0; i < opaqueCount; i++) {
        const idx = i * 4;
        imageData.data[idx] = 255 - i * 55;
        imageData.data[idx + 1] = 0;
        imageData.data[idx + 2] = 0;
        imageData.data[idx + 3] = 255;
      }

      const result = calculateAverageColor(imageData, 0, 0, 4, 4);
      expect(result.r).toBe(Math.floor(totalR / opaqueCount));
    });

    it('should handle black pixels', () => {
      const imageData = new MockImageData(4, 4);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 0;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 255;
      }

      const result = calculateAverageColor(imageData, 0, 0, 4, 4);
      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should handle white pixels', () => {
      const imageData = new MockImageData(4, 4);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 255;
        imageData.data[i + 2] = 255;
        imageData.data[i + 3] = 255;
      }

      const result = calculateAverageColor(imageData, 0, 0, 4, 4);
      expect(result.r).toBe(255);
      expect(result.g).toBe(255);
      expect(result.b).toBe(255);
    });
  });
});