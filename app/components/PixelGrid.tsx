/**
 * 像素网格组件
 * 显示像素化后的网格，支持点击编辑和放大镜功能
 */

import { useRef, useState, useCallback } from 'react';
import type { MappedPixel, BrandKey } from '@/types/color';

interface PixelGridProps {
  grid: MappedPixel[][];
  cellSize?: number;
  zoom?: number;
  showGrid?: boolean;
  showCoordinates?: boolean;
  showColorCodes?: boolean;
  brand?: BrandKey;
  onPixelClick?: (row: number, col: number) => void;
  onPixelHover?: (row: number, col: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export function PixelGrid({
  grid,
  cellSize = 20,
  zoom = 1,
  showGrid = true,
  showCoordinates = false,
  showColorCodes = false,
  brand = 'perler',
  onPixelClick,
  onPixelHover,
  onZoomChange
}: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const effectiveCellSize = cellSize * zoom;

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
      case 'perler':
        // 去掉前缀，只显示尾数（如 "80-15179" → "15179"）
        const parts = code.split('-');
        return parts[parts.length - 1] || code;
      case 'hama':
        // 只显示数字，去掉H前缀
        return code.replace(/^[HS]/, '');
      case 'artkal':
        // 只显示数字，去掉S前缀
        return code.replace(/^[HS]/, '');
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

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!onZoomChange) return;

    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1; // 向下滚动缩小，向上滚动放大
    const newZoom = Math.max(0.5, Math.min(5, zoom + delta));

    onZoomChange(newZoom);
  }, [onZoomChange, zoom]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.5, 5);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 0.5);
    onZoomChange?.(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange?.(1);
  };

  return (
    <div
      ref={containerRef}
      className="pixel-grid"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)'
      }}
    >
      {/* 缩放控制 */}
      {onZoomChange && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            style={{
              padding: '4px 8px',
              border: '2px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-background)',
              cursor: zoom > 0.5 ? 'pointer' : 'not-allowed',
              fontSize: '18px'
            }}
            type="button"
          >
            −
          </button>
          <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '50px', textAlign: 'center' }}>
            {zoom}x
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            style={{
              padding: '4px 8px',
              border: '2px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-background)',
              cursor: zoom < 5 ? 'pointer' : 'not-allowed',
              fontSize: '18px'
            }}
            type="button"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            style={{
              padding: '4px 12px',
              border: '2px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-background)',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: 'auto'
            }}
            type="button"
          >
            重置
          </button>
        </div>
      )}

      {/* 网格 */}
      <div
        onWheel={handleWheel}
        style={{
          display: 'inline-block',
          overflow: 'auto',
          maxHeight: zoom > 1 ? '700px' : '600px',
          maxWidth: '100%'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${effectiveCellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${effectiveCellSize}px)`,
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
                    width: `${effectiveCellSize}px`,
                    height: `${effectiveCellSize}px`,
                    backgroundColor: color,
                    border: showGrid ? `${Math.max(1 / zoom, 0.5)}px solid rgba(45, 52, 54, 0.05)` : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.15s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
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
                        fontSize: `${Math.max(8 / zoom, 6)}px`,
                        color: 'rgba(45, 52, 54, 0.7)',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {rowIdx},{colIdx}
                    </span>
                  )}
                  {showColorCodes && pixel?.matchedColor && effectiveCellSize >= 18 && (
                    <>
                      {/* 透明背景，文字根据亮度自动选择颜色 */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: zoom > 1 ? `${parseFloat(getCodeFontSize(brand)) * zoom}px` : getCodeFontSize(brand),
                          color: getTextColor(getBrightness(pixel.matchedColor.hex)),
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          textShadow: '0 0 2px rgba(255,255,255,0.5)'
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
    </div>
  );
}
