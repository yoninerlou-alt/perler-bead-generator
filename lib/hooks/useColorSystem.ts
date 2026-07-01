/**
 * 色号系统Hook
 */

import { useState, useCallback } from 'react';
import type { ColorSystemMapping, BrandKey, BeadColor } from '@/types/color';

export function useColorSystem() {
  const [colorSystem, setColorSystem] = useState<ColorSystemMapping | null>(null);
  const [currentBrand, setCurrentBrand] = useState<BrandKey>('perler');
  const [currentPalette, setCurrentPalette] = useState<BeadColor[]>([]);

  /**
   * 加载色号系统
   */
  const loadColorSystem = useCallback(async () => {
    try {
      const response = await fetch('/data/colorSystemMapping.json');
      const data: ColorSystemMapping = await response.json();
      setColorSystem(data);
      setCurrentPalette(data.perler.colorData);
    } catch (error) {
      console.error('加载色号系统失败:', error);
    }
  }, []);

  /**
   * 切换品牌
   */
  const switchBrand = useCallback((brand: BrandKey) => {
    setCurrentBrand(brand);
    if (colorSystem) {
      setCurrentPalette(colorSystem[brand].colorData);
    }
  }, [colorSystem]);

  /**
   * 获取当前品牌信息
   */
  const getCurrentBrandInfo = useCallback(() => {
    if (!colorSystem || !currentBrand) {
      return null;
    }
    return colorSystem[currentBrand];
  }, [colorSystem, currentBrand]);

  /**
   * 按类别过滤颜色
   */
  const getColorsByCategory = useCallback((category: string) => {
    return currentPalette.filter(color => color.category === category);
  }, [currentPalette]);

  /**
   * 搜索颜色
   */
  const searchColors = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return currentPalette.filter(
      color =>
        color.name.toLowerCase().includes(lowerQuery) ||
        color.code.toLowerCase().includes(lowerQuery) ||
        color.hex.toLowerCase().includes(lowerQuery)
    );
  }, [currentPalette]);

  return {
    colorSystem,
    currentBrand,
    currentPalette,
    loadColorSystem,
    switchBrand,
    getCurrentBrandInfo,
    getColorsByCategory,
    searchColors
  };
}