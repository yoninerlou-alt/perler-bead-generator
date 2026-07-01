/**
 * 可爱滑块组件
 */

'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface CuteSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  icon?: ReactNode;
  marks?: Array<{ value: number; label: string }>;
  className?: string;
}

export function CuteSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  disabled = false,
  size = 'md',
  showValue = false,
  label,
  icon,
  marks,
  className = ''
}: CuteSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);

  // 计算位置
  const percentage = ((value - min) / (max - min)) * 100;

  // 处理滑块点击
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;

    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const clickPercentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = min + clickPercentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    onChange(Math.min(max, Math.max(min, steppedValue)));
  };

  // 处理拖拽
  const handleDragStart = () => {
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || disabled) return;

    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const dragPercentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = min + dragPercentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    onChange(Math.min(max, Math.max(min, steppedValue)));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 全局拖拽事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // 键盘控制
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, value + step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      case 'PageDown':
        newValue = Math.max(min, value - step * 10);
        break;
      case 'PageUp':
        newValue = Math.min(max, value + step * 10);
        break;
      default:
        return;
    }

    e.preventDefault();
    onChange(newValue);
  };

  return (
    <div className={`cute-slider-wrapper cute-slider-${size} ${className}`}>
      {(label || icon) && (
        <div className="slider-label">
          {icon && <span className="slider-icon">{icon}</span>}
          {label && <span className="slider-text">{label}</span>}
          {showValue && <span className="slider-value">{value}</span>}
        </div>
      )}
      <div
        ref={sliderRef}
        className={`cute-slider ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
      >
        {/* 滑块轨道 */}
        <div className="slider-track">
          <div className="slider-fill" style={{ width: `${percentage}%` }} />
        </div>

        {/* 标记点 */}
        {marks && (
          <div className="slider-marks">
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className={`slider-mark ${value >= mark.value ? 'passed' : ''}`}
                  style={{ left: `${markPercentage}%` }}
                >
                  <span className="mark-label">{mark.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 滑块手柄 */}
        <button
          ref={thumbRef}
          className="slider-thumb"
          style={{ left: `${percentage}%` }}
          onMouseDown={handleDragStart}
          onKeyDown={handleKeyDown}
          type="button"
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        >
          <span className="thumb-icon" />
        </button>
      </div>
    </div>
  );
}