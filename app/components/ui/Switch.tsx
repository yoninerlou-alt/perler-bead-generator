/**
 * 可爱开关组件
 */

import type { ReactNode } from 'react';

export interface CuteSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export function CuteSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  icon,
  className = ''
}: CuteSwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`cute-switch-wrapper cute-switch-${size} ${className}`}>
      {label && <span className="switch-label">{label}</span>}
      <button
        className={`cute-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span className="switch-slider">
          {icon && <span className="switch-icon">{icon}</span>}
        </span>
      </button>
    </div>
  );
}