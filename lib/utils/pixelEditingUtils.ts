/**
 * 像素编辑工具（上色、橡皮擦、历史记录）
 */

import type { MappedPixel, RgbColor, BeadColor } from '@/types/color';
import { rgbToLabFromObject, deltaE2000 } from './colorUtils';

/**
 * 编辑工具类型
 */
export type EditTool = 'brush' | 'eraser' | 'fill' | 'picker';

/**
 * 编辑历史记录
 */
export interface EditHistory {
  grid: MappedPixel[][];
  timestamp: number;
  action: string;
}

/**
 * 上色单个像素
 */
export function paintPixel(
  grid: MappedPixel[][],
  row: number,
  col: number,
  color: BeadColor
): MappedPixel[][] {
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
    return grid;
  }

  const newGrid = grid.map(r => r.map(p => ({ ...p })));
  newGrid[row][col] = {
    ...newGrid[row][col],
    color,
    rgb: color.rgb,
    lab: color.lab,
    matchedColor: color,
    distance: 0
  };

  return newGrid;
}

/**
 * 擦除单个像素
 */
export function erasePixel(
  grid: MappedPixel[][],
  row: number,
  col: number
): MappedPixel[][] {
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
    return grid;
  }

  const newGrid = grid.map(r => r.map(p => ({ ...p })));
  newGrid[row][col] = {
    ...newGrid[row][col],
    color: null,
    rgb: { r: 0, g: 0, b: 0 },
    lab: { l: 0, a: 0, b: 0 },
    matchedColor: null,
    distance: 0
  };

  return newGrid;
}

/**
 * 批量颜色替换
 */
export function batchReplaceColor(
  grid: MappedPixel[][],
  oldColor: BeadColor,
  newColor: BeadColor
): MappedPixel[][] {
  const tolerance = 10; // 颜色差异容忍度

  return grid.map(row =>
    row.map(pixel => {
      if (!pixel.color || !pixel.matchedColor) {
        return { ...pixel };
      }

      const distance = deltaE2000(oldColor.lab, pixel.matchedColor.lab);
      if (distance <= tolerance) {
        return {
          ...pixel,
          color: newColor,
          rgb: newColor.rgb,
          lab: newColor.lab,
          matchedColor: newColor,
          distance: 0
        };
      }

      return { ...pixel };
    })
  );
}

/**
 * 添加历史记录（使用 JSON 序列化优化性能）
 */
export function addToHistory(
  history: EditHistory[],
  grid: MappedPixel[][],
  action: string,
  maxSize: number = 50
): EditHistory[] {
  const newHistory = [
    {
      grid: JSON.parse(JSON.stringify(grid)),
      timestamp: Date.now(),
      action
    },
    ...history
  ];

  // 限制历史记录数量
  if (newHistory.length > maxSize) {
    return newHistory.slice(0, maxSize);
  }

  return newHistory;
}

/**
 * 撤销操作（使用 JSON 序列化优化性能）
 */
export function undo(
  history: EditHistory[],
  currentGrid: MappedPixel[][]
): { grid: MappedPixel[][], history: EditHistory[] } | null {
  if (history.length === 0) {
    return null;
  }

  const previous = history[0];
  const newHistory = history.slice(1);

  return {
    grid: JSON.parse(JSON.stringify(previous.grid)),
    history: newHistory
  };
}

/**
 * 重做操作（使用 JSON 序列化优化性能）
 */
export function redo(
  history: EditHistory[],
  future: EditHistory[],
  currentGrid: MappedPixel[][]
): { grid: MappedPixel[][], history: EditHistory[], future: EditHistory[] } | null {
  if (future.length === 0) {
    return null;
  }

  const next = future[0];
  const newFuture = future.slice(1);

  return {
    grid: JSON.parse(JSON.stringify(next.grid)),
    history: [{ ...next, timestamp: Date.now() }, ...history],
    future: newFuture
  };
}

/**
 * 检查网格是否已修改
 */
export function isGridModified(
  grid: MappedPixel[][],
  originalGrid: MappedPixel[][]
): boolean {
  if (grid.length !== originalGrid.length) {
    return true;
  }

  for (let row = 0; row < grid.length; row++) {
    if (grid[row].length !== originalGrid[row].length) {
      return true;
    }

    for (let col = 0; col < grid[row].length; col++) {
      const current = grid[row][col];
      const original = originalGrid[row][col];

      if (current.color?.id !== original.color?.id) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 清空网格（创建新画布）
 */
export function clearGrid(rows: number, cols: number): MappedPixel[][] {
  const grid: MappedPixel[][] = [];

  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      grid[row][col] = {
        row,
        col,
        color: null,
        rgb: { r: 0, g: 0, b: 0 },
        lab: { l: 0, a: 0, b: 0 },
        matchedColor: null,
        distance: 0
      };
    }
  }

  return grid;
}

/**
 * 复制网格（用于预览）
 */
export function cloneGrid(grid: MappedPixel[][]): MappedPixel[][] {
  return grid.map(row =>
    row.map(pixel => ({
      ...pixel,
      rgb: { ...pixel.rgb },
      lab: { ...pixel.lab }
    }))
  );
}

/**
 * 获取网格统计信息
 */
export interface GridStats {
  totalPixels: number;
  coloredPixels: number;
  uniqueColors: number;
  totalBeads: number;
}

export function getGridStats(grid: MappedPixel[][]): GridStats {
  const totalPixels = grid.length * (grid[0]?.length || 0);
  const coloredPixels = grid.flat().filter(p => p.color !== null).length;
  const colorCount = new Map<string, number>();

  for (const row of grid) {
    for (const pixel of row) {
      if (pixel.color) {
        const count = colorCount.get(pixel.color.id) || 0;
        colorCount.set(pixel.color.id, count + 1);
      }
    }
  }

  const uniqueColors = colorCount.size;
  const totalBeads = Array.from(colorCount.values()).reduce((sum, count) => sum + count, 0);

  return {
    totalPixels,
    coloredPixels,
    uniqueColors,
    totalBeads
  };
}