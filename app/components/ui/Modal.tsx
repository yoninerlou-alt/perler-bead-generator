/**
 * 可爱模态框组件
 * 支持遮罩层、动画效果和多种尺寸
 */

import type { ReactNode } from 'react';
import { useEffect } from 'react';

export interface CuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function CuteModal({
  isOpen,
  onClose,
  children,
  title,
  icon,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = ''
}: CuteModalProps) {
  // ESC键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // 阻止body滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="cute-modal-overlay" onClick={handleOverlayClick}>
      <div className={`cute-modal cute-modal-${size} ${className}`}>
        {/* 模态框装饰 */}
        <div className="modal-decoration" />

        {/* 模态框头部 */}
        {(title || icon || showCloseButton) && (
          <div className="modal-header">
            <div className="modal-title-area">
              {icon && <span className="modal-icon">{icon}</span>}
              {title && <h2 className="modal-title">{title}</h2>}
            </div>
            {showCloseButton && (
              <button
                className="modal-close"
                onClick={onClose}
                type="button"
                aria-label="关闭"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* 模态框内容 */}
        <div className="modal-body">{children}</div>

        {/* 模态框底部 */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}