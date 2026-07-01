/**
 * 像素网格组件
 * 显示像素化后的网格，支持点击编辑
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { MappedPixel } from '@/types/color';

interface PixelGridProps {
  grid: MappedPixel[][];
  cellSize?: number;
  showGrid?: boolean;
  showCoordinates?: boolean;
  showColorCodes?: boolean;
  onPixelClick?: (row: number, col: number) => void;
  onPixelHover?: (row: number, col: number) => void;
}

export function PixelGrid({
  grid,
  cellSize = 20,
  showGrid = true,
  showCoordinates = false,
  showColorCodes = false,
  onPixelClick,
  onPixelHover
}: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

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
                {showColorCodes && pixel?.matchedColor && cellSize >= 20 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '7px',
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {pixel.matchedColor.code}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
