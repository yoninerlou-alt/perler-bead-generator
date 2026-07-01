/**
 * 洪水填充工具（背景移除、油漆桶）
 */

import type { MappedPixel, RgbColor } from '@/types/color';

/**
 * 获取连通区域（使用BFS）
 */
export function getAllConnectedRegions(
  grid: MappedPixel[][],
  targetColor: RgbColor,
  tolerance: number = 30
): { row: number; col: number }[][] {
  const visited = new Set<string>();
  const regions: { row: number; col: number }[][] = [];
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row},${col}`;
      if (visited.has(key)) continue;

      const pixel = grid[row]?.[col];
      if (!pixel || !pixel.rgb) continue;

      // 检查颜色是否匹配
      const distance = rgbDistance(pixel.rgb, targetColor);
      if (distance > tolerance) continue;

      // 执行BFS找到所有连通的相似颜色
      const region: { row: number; col: number }[] = [];
      const queue: { row: number; col: number }[] = [{ row, col }];
      visited.add(key);

      while (queue.length > 0) {
        const current = queue.shift()!;
        region.push(current);

        // 检查四个方向
        const directions = [
          { dr: -1, dc: 0 }, // 上
          { dr: 1, dc: 0 },  // 下
          { dr: 0, dc: -1 }, // 左
          { dr: 0, dc: 1 }   // 右
        ];

        for (const { dr, dc } of directions) {
          const newRow = current.row + dr;
          const newCol = current.col + dc;

          // 边界检查
          if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
            continue;
          }

          const neighborKey = `${newRow},${newCol}`;
          if (visited.has(neighborKey)) continue;

          const neighbor = grid[newRow]?.[newCol];
          if (!neighbor || !neighbor.rgb) continue;

          // 检查颜色相似度
          const neighborDistance = rgbDistance(neighbor.rgb, targetColor);
          if (neighborDistance <= tolerance) {
            visited.add(neighborKey);
            queue.push({ row: newRow, col: newCol });
          }
        }
      }

      if (region.length > 0) {
        regions.push(region);
      }
    }
  }

  return regions;
}

/**
 * 洪水填充背景移除
 */
export function floodFillErase(
  grid: MappedPixel[][],
  startRow: number,
  startCol: number,
  targetKey: string
): MappedPixel[][] {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) {
    return grid;
  }

  const startPixel = grid[startRow]?.[startCol];
  if (!startPixel || !startPixel.rgb) {
    return grid;
  }

  const targetColor = { ...startPixel.rgb };
  const tolerance = 30;

  // 使用队列进行BFS
  const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
  const visited = new Set<string>();
  visited.add(`${startRow},${startCol}`);

  const newGrid = grid.map(row => row.map(pixel => ({ ...pixel })));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const pixel = newGrid[current.row]?.[current.col];

    if (!pixel) continue;

    // 清除颜色
    pixel.color = null;
    pixel.matchedColor = null;
    pixel.rgb = { r: 0, g: 0, b: 0 };
    pixel.lab = { l: 0, a: 0, b: 0 };
    pixel.distance = 0;

    // 检查四个方向
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    for (const { dr, dc } of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;

      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
        continue;
      }

      const neighborKey = `${newRow},${newCol}`;
      if (visited.has(neighborKey)) continue;

      const neighbor = newGrid[newRow]?.[newCol];
      if (!neighbor || !neighbor.rgb) continue;

      // 检查颜色相似度
      const distance = rgbDistance(neighbor.rgb, targetColor);
      if (distance <= tolerance) {
        visited.add(neighborKey);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }

  return newGrid;
}

/**
 * 油漆桶工具（填充连通区域）
 */
export function floodFillPaint(
  grid: MappedPixel[][],
  startRow: number,
  startCol: number,
  newColor: RgbColor
): MappedPixel[][] {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) {
    return grid;
  }

  const startPixel = grid[startRow]?.[startCol];
  if (!startPixel || !startPixel.rgb) {
    return grid;
  }

  const targetColor = { ...startPixel.rgb };
  const tolerance = 30;

  // 如果目标颜色和新颜色相同，无需操作
  if (
    Math.abs(targetColor.r - newColor.r) < tolerance &&
    Math.abs(targetColor.g - newColor.g) < tolerance &&
    Math.abs(targetColor.b - newColor.b) < tolerance
  ) {
    return grid;
  }

  const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
  const visited = new Set<string>();
  visited.add(`${startRow},${startCol}`);

  const newGrid = grid.map(row => row.map(pixel => ({ ...pixel })));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const pixel = newGrid[current.row]?.[current.col];

    if (!pixel) continue;

    // 更新颜色
    pixel.rgb = { ...newColor };
    pixel.lab = rgbToLab(newColor.r, newColor.g, newColor.b);
    pixel.distance = 0;

    // 检查四个方向
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    for (const { dr, dc } of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;

      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
        continue;
      }

      const neighborKey = `${newRow},${newCol}`;
      if (visited.has(neighborKey)) continue;

      const neighbor = newGrid[newRow]?.[newCol];
      if (!neighbor || !neighbor.rgb) continue;

      // 检查颜色相似度
      const distance = rgbDistance(neighbor.rgb, targetColor);
      if (distance <= tolerance) {
        visited.add(neighborKey);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }

  return newGrid;
}

/**
 * RGB欧几里得距离
 */
function rgbDistance(rgb1: RgbColor, rgb2: RgbColor): number {
  const dr = rgb2.r - rgb1.r;
  const dg = rgb2.g - rgb1.g;
  const db = rgb2.b - rgb1.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * RGB转CIELAB
 */
function rgbToLab(r: number, g: number, b: number) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];

  const toXYZ = (c: number): number => {
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };

  const rnXYZ = toXYZ(rn);
  const gnXYZ = toXYZ(gn);
  const bnXYZ = toXYZ(bn);

  const x = rnXYZ * 0.4124564 + gnXYZ * 0.3575761 + bnXYZ * 0.1804375;
  const y = rnXYZ * 0.2126729 + gnXYZ * 0.7151522 + bnXYZ * 0.0721750;
  const z = rnXYZ * 0.0193339 + gnXYZ * 0.1191920 + bnXYZ * 0.9503041;

  const toLab = (v: number, ref: number): number => {
    const v2 = v / ref;
    return v2 > 0.008856 ? Math.pow(v2, 1/3) : 7.787 * v2 + 16/116;
  };

  const L = 116 * toLab(y, 1.00000) - 16;
  const a = 500 * (toLab(x, 0.95047) - toLab(y, 1.00000));
  const labB = 200 * (toLab(y, 1.00000) - toLab(z, 1.08883));

  return {
    l: Math.round(L * 100) / 100,
    a: Math.round(a * 100) / 100,
    b: Math.round(labB * 100) / 100
  };
}