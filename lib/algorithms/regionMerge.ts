/**
 * 区域颜色合并算法
 * 使用BFS算法识别连通区域，将小区域合并到相邻的大区域
 * 减少颜色数量，清理杂色
 */

import type { BrandId, ColorCategory } from '@/types';

interface Region {
  pixels: { row: number; col: number }[];
  key: string;
  size: number;
  centerRow: number;
  centerCol: number;
}

/**
 * BFS区域合并
 * @param grid 网格数据
 * @param gridDimensions 网格尺寸
 * @param similarityThreshold 相似度阈值（CIEDE2000，0-100）
 * @param minRegionSize 最小区域大小
 * @returns 合并后的网格数据
 */
export function mergeRegions(
  grid: string[][],
  { N, M }: { N: number; M: number },
  similarityThreshold: number = 15,
  minRegionSize: number = 5
): string[][] {
  const result: string[][] = Array(M).fill(null).map(() => Array(N).fill('TRANSPARENT'));
  const visited = Array(M).fill(null).map(() => Array(N).fill(false));

  // 首先复制原始网格到结果
  for (let row = 0; row < M; row++) {
    for (let col = 0; col < N; col++) {
      result[row][col] = grid[row][col];
    }
  }

  // 识别所有相同颜色的连通区域
  const allRegions = identifyAllRegions(grid, N, M, visited);

  // 找出小区域
  const smallRegions = allRegions.filter(r => r.size < minRegionSize);

  console.log(`识别到 ${allRegions.length} 个区域，其中 ${smallRegions.length} 个小区域`);

  // 合并小区域到相邻的大区域
  for (const smallRegion of smallRegions) {
    const targetRegion = findBestMatchRegion(smallRegion, grid, { N, M }, allRegions);

    if (targetRegion && targetRegion.key !== smallRegion.key) {
      // 将小区域的所有单元格统一为目标区域的颜色
      for (const pixel of smallRegion.pixels) {
        result[pixel.row][pixel.col] = targetRegion.key;
      }
    }
  }

  return result;
}

/**
 * 识别所有相同颜色的连通区域
 * @param grid 网格数据
 * @param N 网格宽度
 * @param M 网格高度
 * @param visited 访问标记
 * @returns 区域列表
 */
function identifyAllRegions(
  grid: string[][],
  N: number,
  M: number,
  visited: boolean[][]
): Region[] {
  const regions: Region[] = [];

  for (let row = 0; row < M; row++) {
    for (let col = 0; col < N; col++) {
      const key = grid[row][col];
      if (!key || key === 'TRANSPARENT' || visited[row][col]) continue;

      const region = bfsIdentifyRegion(grid, N, M, row, col, key);
      if (region.size > 0) {
        regions.push(region);
      }
    }
  }

  return regions;
}

/**
 * 使用BFS识别单个连通区域
 * @param grid 网格数据
 * @param N 网格宽度
 * @param M 网格高度
 * @param startRow 起始行
 * @param startCol 起始列
 * @param targetKey 目标颜色键
 * @returns 识别的区域
 */
function bfsIdentifyRegion(
  grid: string[][],
  N: number,
  M: number,
  startRow: number,
  startCol: number,
  targetKey: string
): Region {
  const pixels: { row: number; col: number }[] = [];
  const visited = new Set<string>();
  const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
  visited.add(`${startRow},${startCol}`);

  let centerRow = 0;
  let centerCol = 0;

  const directions = [
    { row: -1, col: 0 },   // 上
    { row: 1, col: 0 },    // 下
    { row: 0, col: -1 },  // 左
    { row: 0, col: 1 }     // 右
  ];

  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    pixels.push({ row, col });

    centerRow += row;
    centerCol += col;

    // 检查四个方向
    for (const dir of directions) {
      const newRow = row + dir.row;
      const newCol = col + dir.col;

      // 边界检查
      if (newRow < 0 || newRow >= M || newCol < 0 || newCol >= N) continue;

      const key = `${newRow},${newCol}`;
      if (visited.has(key)) continue;

      // 颜色检查
      if (grid[newRow][newCol] === targetKey) {
        visited.add(key);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }

  // 计算区域中心
  const size = pixels.length;
  if (size > 0) {
    centerRow = Math.round(centerRow / size);
    centerCol = Math.round(centerCol / size);
  }

  return {
    pixels,
    key: targetKey,
    size,
    centerRow,
    centerCol
  };
}

/**
 * 找到最佳匹配的大区域
 * @param smallRegion 小区域
 * @param grid 网格数据
 * @param N 网格宽度
 * @param M 网格高度
 * @param allRegions 所有区域
 * @returns 最佳匹配的大区域，如果没有合适匹配则返回null
 */
function findBestMatchRegion(
  smallRegion: Region,
  grid: string[][],
  { N, M }: { N: number; M: number },
  allRegions: Region[]
): Region | null {
  if (!grid || allRegions.length === 0) return null;

  let bestRegion: Region | null = null;
  let maxSharedBoundary = 0;

  // 找出小区域的所有相邻像素
  const neighbors = findRegionNeighbors(smallRegion, grid, N, M);

  // 遍历所有大区域，找到与该小区域共享边界最多的区域
  for (const region of allRegions) {
    if (region.size < smallRegion.size) continue; // 只考虑更大的区域
    if (region.key === smallRegion.key) continue; // 跳过相同颜色的区域

    // 计算共享边界长度
    const sharedBoundary = calculateSharedBoundary(smallRegion, region, neighbors);

    if (sharedBoundary > maxSharedBoundary && sharedBoundary > 0) {
      maxSharedBoundary = sharedBoundary;
      bestRegion = region;
    }
  }

  return bestRegion;
}

/**
 * 找出区域的所有相邻像素
 * @param region 区域
 * @param grid 网格数据
 * @param N 网格宽度
 * @param M 网格高度
 * @returns 相邻像素的统计
 */
function findRegionNeighbors(
  region: Region,
  grid: string[][],
  N: number,
  M: number
): Map<string, number> {
  const neighbors = new Map<string, number>();
  const directions = [
    { row: -1, col: 0 },   // 上
    { row: 1, col: 0 },    // 下
    { row: 0, col: -1 },  // 左
    { row: 0, col: 1 }     // 右
  ];

  for (const pixel of region.pixels) {
    for (const dir of directions) {
      const newRow = pixel.row + dir.row;
      const newCol = pixel.col + dir.col;

      // 边界检查
      if (newRow < 0 || newRow >= M || newCol < 0 || newCol >= N) continue;

      const neighborKey = grid[newRow][newCol];
      if (neighborKey && neighborKey !== 'TRANSPARENT') {
        neighbors.set(neighborKey, (neighbors.get(neighborKey) || 0) + 1);
      }
    }
  }

  return neighbors;
}

/**
 * 计算两个区域共享边界的长度
 * @param region1 区域1
 * @param region2 区域2
 * @param neighbors 区域1的相邻像素统计
 * @returns 共享边界长度
 */
function calculateSharedBoundary(
  region1: Region,
  region2: Region,
  neighbors: Map<string, number>
): number {
  return neighbors.get(region2.key) || 0;
}

/**
 * 设置所有像素为备用色
 * @param grid 网格数据
 * @param fallbackKey 回退色号键
 * @returns 处理后的网格数据
 */
export function setAllPixelsToFallback(
  grid: string[][],
  fallbackKey: string
): string[][] {
  return grid.map(row =>
    row.map(() => fallbackKey)
  );
}

/**
 * 复制透明像素为外部
 * @param grid 网格数据
 * @returns 处理后的网格数据
 */
export function setExternalPixels(
  grid: string[][]
): string[][] {
  const EXTERNAL_KEYS = ['TRANSPARENT', 'EXTERNAL'];
  return grid.map(row =>
    row.map(cell => EXTERNAL_KEYS.some(key => cell.includes(key)) ? 'TRANSPARENT' : cell)
  );
}

/**
 * 从网格中提取颜色统计
 * @param grid 网格数据
 * @returns 颜色统计Map
 */
export function extractColorStats(grid: string[][]): Map<string, number> {
  const colorCounts = new Map<string, number>();

  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 'TRANSPARENT') {
        const count = colorCounts.get(cell) || 0;
        colorCounts.set(cell, count + 1);
      }
    }
  }

  return colorCounts;
}

/**
 * 过滤特定颜色（排除功能）
 * @param grid 网格数据
 * @param colorsToKeep 要保留的颜色列表
 * @returns 过滤后的网格数据
 */
export function filterByColors(
  grid: string[][],
  colorsToKeep: string[]
): string[][] {
  return grid.map(row =>
    row.map(cell =>
      colorsToKeep.includes(cell) ? cell : 'TRANSPARENT'
    )
  );
}

/**
 * 计算颜色差异（用于调参）
 * @param lab1 颜色1的Lab值
 * @param lab2 颜色2的Lab值
 * @returns 颜色差异值
 */
export function calculateColorDifference(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number }
): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}