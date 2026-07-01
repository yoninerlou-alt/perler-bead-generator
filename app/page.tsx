'use client';

/**
 * 拼豆图纸生成器 - 主页面
 * 卡通可爱风格
 */

import { useEffect, useState, useCallback } from 'react';
import { CuteColorPicker } from '@/app/components/CuteColorPicker';
import { CuteToolbar } from '@/app/components/CuteToolbar';
import { CuteShoppingList } from '@/app/components/CuteShoppingList';
import { PixelGrid } from '@/app/components/PixelGrid';
import { ImageUploader } from '@/app/components/ImageUploader';
import { PWAInstallPrompt } from '@/app/components/PWAInstallPrompt';
import { useColorSystem } from '@/lib/hooks/useColorSystem';
import { useEditorState } from '@/lib/hooks/useEditorState';
import type { BrandKey, BeadColor, ShoppingList, ExportSettings } from '@/types/color';
import {
  generateCanvasExport,
  generateShoppingList,
  downloadPNG,
  downloadCSV,
  downloadJSON,
  exportShoppingListToCSV
} from '@/lib/utils/exportUtils';

export default function Home() {
  // 色号系统
  const {
    colorSystem,
    currentBrand,
    currentPalette,
    loadColorSystem,
    switchBrand,
    getColorsByCategory,
    searchColors
  } = useColorSystem();

  // 编辑器状态
  const {
    grid,
    history,
    currentTool,
    selectedColor,
    isModified,
    canUndo,
    canRedo,
    initializeGrid,
    updateGrid,
    handlePaint,
    handleErase,
    handleFill,
    handleUndo,
    handleRedo,
    handleClear,
    cloneCurrentGrid,
    setCurrentTool,
    setSelectedColor
  } = useEditorState();

  // 导出设置
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    showGrid: true,
    showCoordinates: false,
    showColorCodes: true,
    gridSize: 20,
    backgroundColor: '#FFFFFF'
  });

  // 采购清单
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  // 品牌切换
  const handleBrandChange = useCallback((brand: BrandKey) => {
    switchBrand(brand);
  }, [switchBrand]);

  // 颜色选择
  const handleColorSelect = useCallback((color: BeadColor) => {
    setSelectedColor(color);
  }, [setSelectedColor]);

  // 工具切换
  const handleToolChange = useCallback((tool: 'brush' | 'eraser' | 'fill' | 'picker') => {
    setCurrentTool(tool);
  }, [setCurrentTool]);

  // 网格点击
  const handlePixelClick = useCallback((row: number, col: number) => {
    if (!selectedColor) return;

    switch (currentTool) {
      case 'brush':
        handlePaint(row, col, selectedColor);
        break;
      case 'eraser':
        handleErase(row, col);
        break;
      case 'fill':
        handleFill(row, col, selectedColor);
        break;
      case 'picker':
        // 颜色选择器逻辑
        const pixel = grid[row]?.[col];
        if (pixel?.color) {
          handleColorSelect(pixel.color);
        }
        break;
    }
  }, [currentTool, selectedColor, grid, handlePaint, handleErase, handleFill, handleColorSelect]);

  // 像素悬停
  const handlePixelHover = useCallback((row: number, col: number) => {
    // 可以用于显示像素信息
  }, []);

  // 图片上传完成
  const handleGridGenerated = useCallback((newGrid: import('@/types/color').MappedPixel[][]) => {
    if (!newGrid || newGrid.length === 0) return;

    const rows = newGrid.length;
    const cols = newGrid[0]?.length || 0;

    // 初始化网格状态（设置行/列）
    initializeGrid(rows, cols);

    // 深拷贝并设置实际像素数据
    const gridCopy = newGrid.map(row =>
      row.map(pixel => ({
        ...pixel,
        lab: pixel.lab || { l: 0, a: 0, b: 0 }
      }))
    );

    // 更新编辑器状态
    updateGrid(gridCopy, '图片上传');
  }, [initializeGrid, updateGrid]);

  // 导出PNG
  const handleExportPNG = useCallback(async () => {
    try {
      const blob = await generateCanvasExport(grid, exportSettings, currentBrand, 20);
      downloadPNG(blob, 'perler-pattern.png');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  }, [grid, exportSettings, currentBrand]);

  // 生成采购清单
  const handleGenerateShoppingList = useCallback(() => {
    if (!colorSystem) return;

    const list = generateShoppingList(grid, colorSystem[currentBrand].brandName);
    setShoppingList(list);
    setShowShoppingList(true);
  }, [grid, colorSystem, currentBrand]);

  // 导出CSV
  const handleExportCSV = useCallback(() => {
    if (!shoppingList) return;

    const csv = exportShoppingListToCSV(shoppingList);
    downloadCSV(csv, 'shopping-list.csv');
  }, [shoppingList]);

  // 导出JSON
  const handleExportJSON = useCallback(() => {
    if (!shoppingList) return;

    downloadJSON(shoppingList, 'shopping-list.json');
  }, [shoppingList]);

  // 加载色号系统
  useEffect(() => {
    loadColorSystem();
  }, [loadColorSystem]);

  // 渲染主界面
  return (
    <main className="cute-main">
      {/* 顶部品牌切换 */}
      {colorSystem && (
        <div className="brand-selector">
          <div className="brand-buttons">
            <button
              className={`brand-btn ${currentBrand === 'perler' ? 'active' : ''}`}
              onClick={() => handleBrandChange('perler')}
              type="button"
            >
              🎯 Perler
            </button>
            <button
              className={`brand-btn ${currentBrand === 'hama' ? 'active' : ''}`}
              onClick={() => handleBrandChange('hama')}
              type="button"
            >
              🌈 Hama
            </button>
            <button
              className={`brand-btn ${currentBrand === 'artkal' ? 'active' : ''}`}
              onClick={() => handleBrandChange('artkal')}
              type="button"
            >
              ✨ Artkal
            </button>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="main-content">
        {/* 左侧：图片上传和工具 */}
        <div className="left-panel">
          <div className="panel-card">
            <h2 className="panel-title">📸 上传图片</h2>
            {colorSystem && (
              <ImageUploader
                onGridGenerated={handleGridGenerated}
                selectedPalette={currentPalette}
                pixelSize={20}
              />
            )}
          </div>

          {/* 颜色选择器 */}
          {colorSystem && selectedColor && (
            <div className="panel-card">
              <h2 className="panel-title">🎨 颜色选择</h2>
              <CuteColorPicker
                colors={currentPalette}
                selectedColor={selectedColor}
                onSelect={handleColorSelect}
              />
            </div>
          )}
        </div>

        {/* 中间：像素网格 */}
        <div className="center-panel">
          <div className="panel-card grid-card">
            {grid.length > 0 ? (
              <PixelGrid
                grid={grid}
                cellSize={20}
                showGrid={exportSettings.showGrid}
                showCoordinates={exportSettings.showCoordinates}
                showColorCodes={exportSettings.showColorCodes}
                brand={currentBrand}
                onPixelClick={handlePixelClick}
                onPixelHover={handlePixelHover}
              />
            ) : (
              <div className="empty-grid">
                <span className="empty-emoji">🖼️</span>
                <p>上传图片开始创作~</p>
              </div>
            )}

            {/* 导出按钮 */}
            {grid.length > 0 && (
              <div className="export-actions">
                <button
                  className="cute-btn primary"
                  onClick={handleExportPNG}
                  type="button"
                >
                  📥 导出PNG
                </button>
                <button
                  className="cute-btn secondary"
                  onClick={handleGenerateShoppingList}
                  type="button"
                >
                  🛒 生成清单
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：工具和清单 */}
        <div className="right-panel">
          {/* 工具栏 */}
          <div className="panel-card">
            <h2 className="panel-title">🔧 工具</h2>
            <CuteToolbar
              activeTool={currentTool}
              onToolChange={handleToolChange}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
            />

            {/* 导出设置 */}
            <div className="export-settings">
              <h3 className="settings-title">⚙️ 导出设置</h3>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={exportSettings.showGrid}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      showGrid: e.target.checked
                    }))
                  }
                />
                <span>显示网格</span>
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={exportSettings.showCoordinates}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      showCoordinates: e.target.checked
                    }))
                  }
                />
                <span>显示坐标</span>
              </label>
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={exportSettings.showColorCodes}
                  onChange={(e) =>
                    setExportSettings((prev) =>
                      ({ ...prev, showColorCodes: e.target.checked })
                    )
                  }
                />
                <span>显示色号</span>
              </label>
            </div>
          </div>

          {/* 采购清单 */}
          {showShoppingList && shoppingList && (
            <div className="panel-card">
              <h2 className="panel-title">🛒 购物清单</h2>
              <CuteShoppingList
                shoppingList={shoppingList}
                viewMode="mixed"
                onViewModeChange={(mode) => console.log('View mode changed to:', mode)}
              />

              {/* 导出按钮 */}
              <div className="list-actions">
                <button
                  className="cute-btn secondary"
                  onClick={handleExportCSV}
                  type="button"
                >
                  📄 导出CSV
                </button>
                <button
                  className="cute-btn secondary"
                  onClick={handleExportJSON}
                  type="button"
                >
                  💾 导出JSON
                </button>
                <button
                  className="cute-btn"
                  onClick={() => setShowShoppingList(false)}
                  type="button"
                >
                  ✅ 完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部工具栏 */}
      {grid.length > 0 && (
        <CuteToolbar
          activeTool={currentTool}
          onToolChange={handleToolChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
      )}

      {/* PWA安装提示 */}
      <PWAInstallPrompt />

      <style jsx>{`
        .cute-main {
          min-height: 100vh;
          padding: var(--space-xl);
          background: var(--color-background);
          font-family: var(--font-body);
        }

        .brand-selector {
          margin-bottom: var(--space-xl);
        }

        .brand-buttons {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
        }

        .brand-btn {
          padding: var(--space-md) var(--space-lg);
          border: 3px solid var(--color-border-light);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          font-family: var(--font-heading);
          font-size: 16px;
          color: var(--color-text);
          cursor: pointer;
          transition: all var(--duration-normal) var(--easing-bounce);
        }

        .brand-btn:hover {
          border-color: var(--color-primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .brand-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .main-content {
          display: grid;
          grid-template-columns: 280px 1fr 320px;
          gap: var(--space-xl);
          margin-bottom: var(--space-3xl);
        }

        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
          }
        }

        .panel-card {
          background: var(--color-surface);
          border: 3px solid var(--color-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow);
        }

        .panel-title {
          font-family: var(--font-heading);
          font-size: 24px;
          color: var(--color-primary);
          margin: 0 0 var(--space-lg);
        }

        .left-panel,
        .center-panel,
        .right-panel {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .empty-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: var(--color-text-light);
          background: var(--color-background);
          border: 3px dashed var(--color-border-light);
          border-radius: var(--radius-lg);
        }

        .empty-emoji {
          font-size: 64px;
          margin-bottom: var(--space-md);
        }

        .empty-grid p {
          font-size: 16px;
          margin: 0;
        }

        .grid-card {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .export-actions {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-lg);
          justify-content: center;
        }

        .export-settings {
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: 2px solid var(--color-border-light);
        }

        .settings-title {
          font-family: var(--font-heading);
          font-size: 18px;
          color: var(--color-text);
          margin-bottom: var(--space-md);
        }

        .setting-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
          font-size: 14px;
          color: var(--color-text);
        }

        .setting-item input {
          accent-color: var(--color-primary);
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .list-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-top: var(--space-lg);
        }

        .cute-btn {
          padding: var(--space-md) var(--space-xl);
          border: 2px solid transparent;
          border-radius: var(--radius-xl);
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
        }

        .cute-btn.primary {
          background: var(--color-primary);
          color: white;
        }

        .cute-btn.primary:hover {
          background: #FF5887;
        }

        .cute-btn.secondary {
          background: var(--color-secondary);
          color: var(--color-text);
        }

        .cute-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </main>
  );
}