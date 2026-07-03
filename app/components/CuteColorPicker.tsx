/**
 * 可爱颜色选择器组件
 */

import type { BeadColor } from '@/types/color';
import { useMemo } from 'react';

interface CuteColorPickerProps {
  colors: BeadColor[];
  selectedColor: BeadColor | null;
  onSelect: (color: BeadColor) => void;
  title?: string;
}

export function CuteColorPicker({
  colors,
  selectedColor,
  onSelect,
  title = '🎨 选择颜色'
}: CuteColorPickerProps) {
  const categories = Array.from(new Set(colors.map(c => c.category)));

  // 计算颜色的亮度（用于确定文字颜色）
  const getBrightness = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  // 根据亮度选择文字颜色
  const getTextColor = (hex: string): string => {
    const brightness = getBrightness(hex);
    return brightness > 230 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)';
  };

  return (
    <div className="cute-color-picker">
      <div className="cute-header">
        <h3 className="cute-title">{title}</h3>
        {selectedColor && (
          <span className="selected-color-badge">
            {selectedColor.name} ({selectedColor.code})
          </span>
        )}
      </div>

      {categories.map((category) => (
        <div key={category} className="category-section">
          <h4 className="category-title">
            {getCategoryEmoji(category)} {capitalizeFirstLetter(category)}
          </h4>
          <div className="cute-colors-grid">
            {colors
              .filter((color) => color.category === category)
              .map((color) => (
                <button
                  key={color.id}
                  className={`cute-color-bubble ${
                    selectedColor?.id === color.id ? 'selected' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => onSelect(color)}
                  title={color.name}
                  type="button"
                >
                  <span className="color-selector-code" style={{ color: getTextColor(color.hex) }}>
                    {color.code}
                  </span>
                  {selectedColor?.id === color.id && (
                    <span className="selected-emoji">✨</span>
                  )}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    solid: '🎨',
    pastel: '🌸',
    neon: '💡',
    metallic: '✨',
    glitter: '💎',
    translucent: '💧'
  };
  return emojiMap[category] || '🎨';
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}