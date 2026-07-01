/**
 * 可爱选择器组件
 * 支持自定义选项、图标、分组等
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface CuteSelectProps {
  value: string;
  options: SelectOption[] | SelectGroup[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  icon?: ReactNode;
  className?: string;
  searchable?: boolean;
  clearable?: boolean;
}

function isGroupedOptions(options: SelectOption[] | SelectGroup[]): options is SelectGroup[] {
  return options.length > 0 && 'options' in options[0];
}

export function CuteSelect({
  value,
  options,
  onChange,
  placeholder = '请选择',
  disabled = false,
  size = 'md',
  label,
  icon,
  className = '',
  searchable = false,
  clearable = false
}: CuteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  // 获取当前选中的选项
  const getSelectedOption = (): SelectOption | null => {
    if (isGroupedOptions(options)) {
      for (const group of options) {
        const found = group.options.find((opt) => opt.value === value);
        if (found) return found;
      }
    } else {
      return options.find((opt) => opt.value === value) || null;
    }
    return null;
  };

  const selectedOption = getSelectedOption();

  // 过滤选项（搜索功能）
  const filterOptions = (opts: SelectOption[]): SelectOption[] => {
    if (!searchText) return opts;
    return opts.filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchText('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchText('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`cute-select-wrapper cute-select-${size} ${disabled ? 'disabled' : ''} ${className}`}
    >
      {(label || icon) && (
        <div className="select-label">
          {icon && <span className="select-icon">{icon}</span>}
          {label && <span className="select-text">{label}</span>}
        </div>
      )}
      <button
        className={`cute-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="select-value">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="value-icon">{selectedOption.icon}</span>}
              <span className="value-text">{selectedOption.label}</span>
            </>
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </div>
        <div className="select-actions">
          {clearable && value && !disabled && (
            <button
              className="select-clear"
              onClick={handleClear}
              type="button"
              aria-label="清除选择"
            >
              ✕
            </button>
          )}
          <span className={`select-arrow ${isOpen ? 'up' : ''}`}>▼</span>
        </div>
      </button>

      {isOpen && (
        <div className="cute-select-dropdown">
          {/* 搜索框 */}
          {searchable && (
            <div className="select-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索..."
                autoFocus
              />
            </div>
          )}

          {/* 选项列表 */}
          <div className="select-options">
            {isGroupedOptions(options) ? (
              options.map((group) => {
                const filtered = filterOptions(group.options);
                if (filtered.length === 0) return null;
                return (
                  <div key={group.label} className="select-group">
                    <div className="group-label">{group.label}</div>
                    {filtered.map((option) => (
                      <SelectOptionItem
                        key={option.value}
                        option={option}
                        isSelected={option.value === value}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                );
              })
            ) : (
              filterOptions(options).map((option) => (
                <SelectOptionItem
                  key={option.value}
                  option={option}
                  isSelected={option.value === value}
                  onSelect={handleSelect}
                />
              ))
            )}
            {/* 无结果 */}
            {(isGroupedOptions(options)
              ? options.every((g) => filterOptions(g.options).length === 0)
              : filterOptions(options).length === 0) && (
              <div className="select-no-results">无匹配结果</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectOptionItemProps {
  option: SelectOption;
  isSelected: boolean;
  onSelect: (option: SelectOption) => void;
}

function SelectOptionItem({ option, isSelected, onSelect }: SelectOptionItemProps) {
  return (
    <div
      className={`select-option ${isSelected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
      onClick={() => onSelect(option)}
      role="option"
      aria-selected={isSelected}
    >
      {option.icon && <span className="option-icon">{option.icon}</span>}
      <div className="option-content">
        <span className="option-label">{option.label}</span>
        {option.description && (
          <span className="option-description">{option.description}</span>
        )}
      </div>
      {isSelected && <span className="option-check">✓</span>}
    </div>
  );
}