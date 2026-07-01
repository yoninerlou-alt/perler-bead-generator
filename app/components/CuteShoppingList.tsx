/**
 * 混合采购清单组件
 */

import type { ShoppingList } from '@/types/color';

interface CuteShoppingListProps {
  shoppingList: ShoppingList | null;
  viewMode: 'table' | 'card' | 'mixed';
  onViewModeChange: (mode: 'table' | 'card' | 'mixed') => void;
}

export function CuteShoppingList({
  shoppingList,
  viewMode,
  onViewModeChange
}: CuteShoppingListProps) {
  if (!shoppingList || shoppingList.items.length === 0) {
    return (
      <div className="cute-shopping-list">
        <div className="cute-header">
          <h2 className="cute-title">🛒 购物清单</h2>
        </div>
        <div className="empty-state">
          <span className="empty-emoji">🛍️</span>
          <p>先创建图案，然后查看购物清单~</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cute-shopping-list">
      <div className="cute-header">
        <h2 className="cute-title">🛒 购物清单</h2>

        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => onViewModeChange('table')}
            type="button"
          >
            📋 表格
          </button>
          <button
            className={`mode-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => onViewModeChange('card')}
            type="button"
          >
            🎴 色卡
          </button>
          <button
            className={`mode-btn ${viewMode === 'mixed' ? 'active' : ''}`}
            onClick={() => onViewModeChange('mixed')}
            type="button"
          >
            🎨 混合
          </button>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-item">
          <span className="summary-label">总珠子数</span>
          <span className="summary-value">{shoppingList.summary.totalBeads}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">颜色种类</span>
          <span className="summary-value">{shoppingList.summary.uniqueColors}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">预估包数</span>
          <span className="summary-value">{shoppingList.summary.estimatedPackages}</span>
        </div>
      </div>

      {viewMode === 'mixed' && (
        <div className="mixed-view">
          {shoppingList.items.map((item) => (
            <div key={item.colorCode} className="shopping-item">
              <div className="color-preview">
                <div
                  className="color-swatch"
                  style={{ backgroundColor: item.colorHex }}
                />
                <div className="color-info">
                  <span className="color-code">{item.colorCode}</span>
                  <span className="color-name">{item.colorName}</span>
                </div>
              </div>

              <div className="quantity-badge">
                <span className="quantity">{item.quantity}</span>
                <span className="unit">粒</span>
              </div>

              <div className="package-info">
                <span className="packages">{item.packages}</span>
                <span className="unit">包</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="table-view">
          <table className="shopping-table">
            <thead>
              <tr>
                <th>色号</th>
                <th>名称</th>
                <th>颜色</th>
                <th>数量</th>
                <th>包数</th>
              </tr>
            </thead>
            <tbody>
              {shoppingList.items.map((item) => (
                <tr key={item.colorCode}>
                  <td>{item.colorCode}</td>
                  <td>{item.colorName}</td>
                  <td>
                    <div
                      className="table-color-swatch"
                      style={{ backgroundColor: item.colorHex }}
                    />
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.packages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'card' && (
        <div className="card-view">
          {shoppingList.items.map((item) => (
            <div key={item.colorCode} className="shopping-card">
              <div
                className="card-color-swatch"
                style={{ backgroundColor: item.colorHex }}
              />
              <div className="card-info">
                <div className="card-code">{item.colorCode}</div>
                <div className="card-name">{item.colorName}</div>
                <div className="card-quantity">
                  {item.quantity} 粒
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}