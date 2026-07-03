/**
 * 可爱工具栏组件
 */

import type { EditTool } from '@/types/color';

interface CuteToolbarProps {
  activeTool: EditTool;
  onToolChange: (tool: EditTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

interface ToolButton {
  id: EditTool;
  icon: string;
  label: string;
}

const tools: ToolButton[] = [
  { id: 'brush', icon: '🖌️', label: '上色' },
  { id: 'eraser', icon: '🧹', label: '橡皮擦' },
  { id: 'fill', icon: '🪣', label: '油漆桶' },
  { id: 'picker', icon: '🎯', label: '取色' }
];

export function CuteToolbar({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  showMagnifier = false,
  onToggleMagnifier
}: CuteToolbarProps) {
  return (
    <div className="cute-toolbar">
      <div className="toolbar-background">
        <div className="toolbar-decoration" />
      </div>

      <div className="toolbar-content">
        <div className="tool-section">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`cute-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => onToolChange(tool.id)}
              type="button"
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
              {activeTool === tool.id && <span className="active-indicator">●</span>}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="action-section">
          <button
            className={`cute-tool-btn ${canUndo ? 'enabled' : 'disabled'}`}
            onClick={canUndo ? onUndo : undefined}
            disabled={!canUndo}
            type="button"
            title="撤销"
          >
            <span className="tool-icon">↩️</span>
            <span className="tool-label">撤销</span>
          </button>

          <button
            className={`cute-tool-btn ${canRedo ? 'enabled' : 'disabled'}`}
            onClick={canRedo ? onRedo : undefined}
            disabled={!canRedo}
            type="button"
            title="重做"
          >
            <span className="tool-icon">↪️</span>
            <span className="tool-label">重做</span>
          </button>

          <button
            className="cute-tool-btn danger"
            onClick={onClear}
            type="button"
            title="清空画布"
          >
            <span className="tool-icon">🗑️</span>
            <span className="tool-label">清空</span>
          </button>
        </div>
      </div>
    </div>
  );
}