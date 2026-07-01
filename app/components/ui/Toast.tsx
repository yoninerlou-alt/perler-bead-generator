/**
 * 可爱提示组件
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  icon?: ReactNode;
  onClose?: () => void;
  showProgress?: boolean;
}

export function CuteToast({
  message,
  type = 'info',
  duration = 3000,
  icon,
  onClose,
  showProgress = true
}: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  // 默认图标
  const defaultIcons: Record<ToastType, ReactNode> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const displayIcon = icon || defaultIcons[type];

  useEffect(() => {
    if (duration === 0) return;

    // 进度条动画
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - 100 / (duration / 50)));
    }, 50);

    // 自动关闭
    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // 等待淡出动画
  };

  return (
    <div className={`cute-toast cute-toast-${type} ${isVisible ? 'visible' : ''}`}>
      <div className="toast-decoration" />
      <div className="toast-content">
        <span className="toast-icon">{displayIcon}</span>
        <span className="toast-message">{message}</span>
        <button
          className="toast-close"
          onClick={handleClose}
          type="button"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>
      {showProgress && duration > 0 && (
        <div
          className="toast-progress"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}

// Toast容器
export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
    icon?: ReactNode;
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="cute-toast-container">
      {toasts.map((toast) => (
        <CuteToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          icon={toast.icon}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}