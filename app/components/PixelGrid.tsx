/**
 * 像素网格组件
 * 显示像素化后的网格，支持点击编辑
 */

import { useRef, useState, useCallback } from 'react';
import type { MappedPixel, BrandKey } from '@/types/color';

interface PixelGridProps {
  grid: MappedPixel[][];
  cellSize?: number;
  showGrid?: boolean;
  showCoordinates?: boolean;
  showColorCodes?: boolean;
  brand?: BrandKey;
  onPixelClick?: (row: number, col: number) => void;
  onPixelHover?: (row: number, col: number) => void;
}

export function PixelGrid({
  grid,
  cellSize = 20,
  showGrid = true,
  showCoordinates = false,
  showColorCodes = false,
  brand = 'perler',
  onPixelClick,
  onPixelHover
}: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // 计算颜色的亮度（用于确定文字颜色）
  const getBrightness = useCallback((hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }, []);

  // 根据亮度选择文字颜色
  const getTextColor = useCallback((brightness: number): string => {
    return brightness > 128 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)';
  }, []);

  // 格式化色号显示
  const formatColorCode = useCallback((code: string, brandKey: BrandKey): string => {
    if (!code) return '';
    switch (brandKey) {
      case 'hama':
        // 只显示数字，去掉H前缀
        return code.replace(/^[HS]/, '');
      case 'artkal':
        // 只显示数字，去掉S前缀
        return code.replace(/^[HS]/, '');
      case 'perler':
      default:
        return code;
    }
  }, []);

  // 根据品牌获取字体大小
  const getCodeFontSize = useCallback((brandKey: BrandKey): string => {
    switch (brandKey) {
      case 'perler':
        return '4px'; // perler色号更长，字体更小
      case 'hama':
      case 'artkal':
        return '6px'; // 只显示数字，字体稍大
      default:
        return '6px';
    }
  }, []);

  if (!grid || grid.length === 0) {
    return null;
  }

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const handleClick = (row: number, col: number) => {
    onPixelClick?.(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    setHoveredCell({ row, col });
    onPixelHover?.(row, col);
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div
      ref={containerRef}
      className="pixel-grid"
      style={{
        display: 'inline-block',
        background: 'var(--color-background)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'auto',
        padding: 'var(--space-md)',
        boxShadow: 'var(--shadow)',
        maxHeight: '500px',
        maxWidth: '100%'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: 0
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((pixel, colIdx) => {
            const color = pixel?.matchedColor?.hex || pixel?.rgb
              ? `rgb(${pixel.rgb.r}, ${pixel.rgb.g}, ${pixel.rgb.b})`
              : '#FFFFFF';
            const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                onClick={() => handleClick(rowIdx, colIdx)}
                onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                onMouseLeave={handleMouseLeave}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: color,
                  border: showGrid ? '1px solid rgba(45, 52, 54, 0.05)' : 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.15s ease',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  zIndex: isHovered ? 10 : 1,
                  boxSizing: 'border-box'
                }}
                title={pixel?.matchedColor ? `${pixel.matchedColor.code} - ${pixel.matchedColor.name}` : ''}
              >
                {showCoordinates && isHovered && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '1px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '8px',
                      color: 'rgba(45, 52, 54, 0.7)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {rowIdx},{colIdx}
                  </span>
                )}
                {showColorCodes && pixel?.matchedColor && cellSize >= 18 && (
                  <>
                    {/* 背景框 */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '1px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: getCodeFontSize(brand),
                        color: getTextColor(getBrightness(pixel.matchedColor.hex)),
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        padding: '0 2px',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatColorCode(pixel.matchedColor.code, brand)}
                    </span>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
