/**
 * 可爱颜色选择器组件
 */

import type { BeadColor } from '@/types/color';

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
                  <span className="cobalt-label">{color.code}</span>
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