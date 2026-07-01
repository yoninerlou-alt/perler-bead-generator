/**
 * 可爱卡片组件
 * 支持不同变体和装饰效果
 */

import type { ReactNode } from 'react';

export interface CuteCardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'gradient';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hoverEffect?: boolean;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function CuteCard({
  children,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'lg',
  hoverEffect = false,
  icon,
  title,
  subtitle,
  className = '',
  onClick
}: CuteCardProps) {
  const baseClasses = `
    cute-card
    cute-card-${variant}
    cute-card-padding-${padding}
    cute-card-radius-${borderRadius}
    ${hoverEffect ? 'hover-effect' : ''}
    ${onClick ? 'clickable' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {/* 卡片装饰 */}
      {variant === 'gradient' && <div className="card-decoration" />}

      {/* 卡片头部 */}
      {(title || icon) && (
        <div className="card-header">
          {icon && <span className="card-icon">{icon}</span>}
          <div className="card-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* 卡片内容 */}
      <div className="card-content">{children}</div>
    </div>
  );
}