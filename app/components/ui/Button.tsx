/**
 * 可爱按钮组件
 * 支持多种变体：primary、secondary、outline、ghost、danger
 */

import type { ReactNode } from 'react';

export interface CuteButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function CuteButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = ''
}: CuteButtonProps) {
  const baseClasses = `
    cute-btn
    cute-btn-${variant}
    cute-btn-${size}
    ${fullWidth ? 'full-width' : ''}
    ${disabled || loading ? 'disabled' : ''}
    ${className}
  `;

  return (
    <button
      className={baseClasses}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="loading-spinner">⏳</span>}
      {!loading && icon && iconPosition === 'left' && (
        <span className="btn-icon-left">{icon}</span>
      )}
      <span className="btn-text">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="btn-icon-right">{icon}</span>
      )}
    </button>
  );
}