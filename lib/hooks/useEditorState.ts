/**
 * 编辑器状态Hook
 */

import { useState, useCallback, useRef } from 'react';
import type { MappedPixel, EditHistory, BeadColor, EditTool } from '@/types/color';
import {
  paintPixel,
  erasePixel,
  addToHistory,
  undo,
  redo,
  isGridModified,
  clearGrid,
  cloneGrid
} from '@/lib/utils/pixelEditingUtils';
import { floodFillPaint } from '@/lib/utils/floodFillUtils';

export function useEditorState() {
  const [grid, setGrid] = useState<MappedPixel[][]>([]);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [future, setFuture] = useState<EditHistory[]>([]);
  const [currentTool, setCurrentTool] = useState<EditTool>('brush');
  const [selectedColor, setSelectedColor] = useState<BeadColor | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const originalGridRef = useRef<MappedPixel[][]>([]);
  const historyRef = useRef<EditHistory[]>([]);
  const futureRef = useRef<EditHistory[]>([]);

  /**
   * 初始化网格
   */
  const initializeGrid = useCallback((rows: number, cols: number) => {
    const newGrid = clearGrid(rows, cols);
    setGrid(newGrid);
    setHistory([]);
    setFuture([]);
    historyRef.current = [];
    futureRef.current = [];
    originalGridRef.current = newGrid;
    setIsModified(false);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  /**
   * 更新网格（带历史记录）
   */
  const updateGrid = useCallback((newGrid: MappedPixel[][], action: string = '') => {
    setGrid(newGrid);
    // 清空 future 栈，因为新操作使重做历史失效
    setFuture([]);
    futureRef.current = [];

    setHistory(prevHistory => {
      const updated = addToHistory(prevHistory, newGrid, action);
      historyRef.current = updated;
      setCanUndo(updated.length > 0);
      setCanRedo(false);
      return updated;
    });
    setIsModified(isGridModified(newGrid, originalGridRef.current));
  }, []);

  /**
   * 上色单个像素
   */
  const handlePaint = useCallback(
    (row: number, col: number, color: BeadColor) => {
      if (!selectedColor) return;

      const newGrid = paintPixel(grid, row, col, selectedColor);
      updateGrid(newGrid, `上色: ${color.code} - (${row}, ${col})`);
    },
    [grid, selectedColor, updateGrid]
  );

  /**
   * 擦除单个像素
   */
  const handleErase = useCallback((row: number, col: number) => {
    const newGrid = erasePixel(grid, row, col);
    updateGrid(newGrid, `擦除: (${row}, ${col})`);
  }, [grid, updateGrid]);

  /**
   * 油漆桶填充
   */
  const handleFill = useCallback(
    (row: number, col: number, color: BeadColor) => {
      if (!color) return;

      const newGrid = floodFillPaint(grid, row, col, color.rgb);
      updateGrid(newGrid, `油漆桶: ${color.code}`);
    },
    [grid, updateGrid]
  );

  /**
   * 快速深拷贝网格（使用 JSON 序列化优化性能）
   */
  const fastCloneGrid = useCallback((gridToClone: MappedPixel[][]): MappedPixel[][] => {
    return JSON.parse(JSON.stringify(gridToClone));
  }, []);

  /**
   * 撤销操作
   */
  const handleUndo = useCallback(() => {
    // 将当前状态添加到 future 栈
    const currentState: EditHistory = {
      grid: fastCloneGrid(grid),
      timestamp: Date.now(),
      action: '撤销前的状态'
    };

    const result = undo(historyRef.current, grid);
    if (result) {
      setGrid(result.grid);
      setHistory(result.history);
      historyRef.current = result.history;

      // 更新 future 栈
      const newFuture = [currentState, ...futureRef.current];
      setFuture(newFuture);
      futureRef.current = newFuture;

      setCanUndo(result.history.length > 0);
      setCanRedo(newFuture.length > 0);
      setIsModified(isGridModified(result.grid, originalGridRef.current));
    }
  }, [grid, fastCloneGrid]);

  /**
   * 重做操作
   */
  const handleRedo = useCallback(() => {
    // 将当前状态添加到 history 栈
    const currentState: EditHistory = {
      grid: fastCloneGrid(grid),
      timestamp: Date.now(),
      action: '重做前的状态'
    };

    const result = redo(historyRef.current, futureRef.current, grid);
    if (result) {
      setGrid(result.grid);
      setHistory(result.history);
      setFuture(result.future);
      historyRef.current = result.history;
      futureRef.current = result.future;

      setCanUndo(result.history.length > 0);
      setCanRedo(result.future.length > 0);
      setIsModified(isGridModified(result.grid, originalGridRef.current));
    }
  }, [grid, fastCloneGrid]);

  /**
   * 清空画布
   */
  const handleClear = useCallback(() => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const newGrid = clearGrid(rows, cols);
    updateGrid(newGrid, '清空画布');
  }, [grid, updateGrid]);

  /**
   * 复制当前网格
   */
  const cloneCurrentGrid = useCallback(() => {
    return cloneGrid(grid);
  }, [grid]);

  return {
    // 状态
    grid,
    history,
    future,
    currentTool,
    selectedColor,
    isModified,
    canUndo,
    canRedo,

    // 状态更新
    setCurrentTool,
    setSelectedColor,

    // 网格操作
    initializeGrid,
    updateGrid,
    handlePaint,
    handleErase,
    handleFill,
    handleUndo,
    handleRedo,
    handleClear,
    cloneCurrentGrid
  };
}