/**
 * 背景移除算法
 * 使用洪水填充算法自动识别和移除背景
 */

import type { BrandId } from '@/types';

/**
 * 背景色号键（预定义的常见背景色）
 */
export const BACKGROUND_COLOR_KEYS = new Map<BrandId, Set<string>>([
  ['perler', new Set(['T1', 'H07', '040', 'T41', '00', '01', '11'])],
  ['hama', new Set(['H01', 'H02', 'H20', 'H21'])],
  ['artkal', new Set(['S01', 'S02', 'S03'])],
  ['nabbi', new Set(['01', '02', '03'])],
  ['pyssla', new Set(['WHITE', 'LIGHT_GRAY', 'GRAY'])],
  ['melty-beads', new Set(['WHITE', 'OFF_WHITE'])],
]);

/**
 * 自动识别背景色
 * @param imageData 图像数据
 * @param imageWidth 图像宽度
 * @param imageHeight 图像高度
 * @returns 识别出的背景色键（hex值）
 */
export function detectBackgroundColor(
  imageData: ImageData,
  imageWidth: number,
  imageHeight: number
): string {
  // 四个角落采样
  const corners = [
    { x: 0, y: 0 },
    { x: imageWidth - 1, y: 0 },
    { x: 0, y: imageHeight - 1 },
    { x: imageWidth - 1, y: imageHeight - 1 }
  ];

  let colorCounts: { [key: string]: number } = {};

  // 采样每个角落
  for (const corner of corners) {
    const index = (corner.y * imageWidth + corner.x) * 4;

    // 检查透明度，忽略透明像素
    if (imageData.data[index + 3] < 128) continue;

    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];

    // 颜色量化
    const rQuantized = Math.round(r / 8) * 8;
    const gQuantized = Math.round(g / 8) * 8;
    const bQuantized = Math.round(b / 8) * 8;

    const colorKey = `${rQuantized},${gQuantized},${bQuantized}`;
    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
  }

  // 找到出现次数最多的颜色
  let maxCount = 0;
  let backgroundColorKey = '';

  for (const [key, count] of Object.entries(colorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      backgroundColorKey = key;
    }
  }

  // 将RGB键转为HEX
  if (backgroundColorKey.includes(',')) {
    const [r, g, b] = backgroundColorKey.split(',').map(Number);
    backgroundColorKey = `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${b.toString(16).padStart(2, '0').toUpperCase()}`;
  }

  return backgroundColorKey;
}

/**
 * 洪水填充移除背景
 * @param grid 网格数据
 * @param gridDimensions 网格尺寸
 * @param backgroundColorKey 背景色键
 * @param brandId 品牌ID
 * @returns 移除背景后的网格数据
 */
export function removeBackground(
  grid: string[][],
  { N, M }: { N: number; M: number },
  backgroundColorKey: string,
  brandId: BrandId
): string[][] {
  const result: string[][] = Array(M).fill(null).map(() => Array(N).fill('TRANSPARENT'));
  const visited = Array(M).fill(null).map(() => Array(N).fill(false));

  const targetKey = backgroundColorKey.toUpperCase();
  const brandBackgroundColors = BACKGROUND_COLOR_KEYS.get(brandId) || new Set();

  const stack: { row: number; col: number }[] = [];

  // 从四个角落开始洪水填充
  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: N - 1 },
    { row: M - 1, col: 0 },
    { row: M - 1, col: N - 1 }
  ];

  // 标记背景区域
  for (const startCorner of corners) {
    if (startCorner.row >= 0 && startCorner.row < M &&
        startCorner.col >= 0 && startCorner.col < N) {
      const cellValue = grid[startCorner.row][startCorner.col];
      if (cellValue && !visited[startCorner.row][startCorner.col]) {
        stack.push(startCorner);
      }
    }
  }

  // BFS洪水填充
  while (stack.length > 0) {
    const { row, col } = stack.pop()!;

    if (row < 0 || row >= M || col < 0 || col >= N) continue;

    // 已访问
    if (visited[row][col]) continue;

    visited[row][col] = true;

    const cellValue = grid[row][col];
    const isBackgroundColor = cellValue === targetKey ||
                            brandBackgroundColors.has(cellValue);

    // 检查是否是背景色
    if (isBackgroundColor) {
      // 标记为透明
      result[row][col] = 'TRANSPARENT';

      // 添加相邻单元格
      const neighbors = [
        { row: row - 1, col },   // 上
        { row: row + 1, col },   // 下
        { row, col: col - 1 }, // 左
        { row, col: col + 1 }    // 右
      ];

      for (const neighbor of neighbors) {
        const { row: nr, col: nc } = neighbor;
        if (nr >= 0 && nr < M && nc >= 0 && nc < N && !visited[nr][nc]) {
          stack.push({ row: nr, col: nc });
        }
      }
    } else {
      // 保留非背景像素
      result[row][col] = cellValue;
    }
  }

  // 对于未访问的像素，保留原值
  for (let row = 0; row < M; row++) {
    for (let col = 0; col < N; col++) {
      if (!visited[row][col] && grid[row][col]) {
        result[row][col] = grid[row][col];
      }
    }
  }

  return result;
}

/**
 * 检查颜色是否是背景色
 * @param colorKey 颜色键
 * @param brandId 品牌ID
 * @returns 是否是背景色
 */
export function isBackgroundColor(colorKey: string, brandId: BrandId): boolean {
  const brandBackgroundColors = BACKGROUND_COLOR_KEYS.get(brandId);
  return brandBackgroundColors ? brandBackgroundColors.has(colorKey) : false;
}

/**
 * 添加自定义背景色
 * @param brandId 品牌ID
 * @param colorKey 颜色键
 */
export function addBackgroundColor(brandId: BrandId, colorKey: string): void {
  if (!BACKGROUND_COLOR_KEYS.has(brandId)) {
    BACKGROUND_COLOR_KEYS.set(brandId, new Set());
  }
  BACKGROUND_COLOR_KEYS.get(brandId)!.add(colorKey);
}

/**
 * 移除自定义背景色
 * @param brandId 品牌ID
 * @param colorKey 颜色键
 */
export function removeBackgroundColor(brandId: BrandId, colorKey: string): void {
  const brandColors = BACKGROUND_COLOR_KEYS.get(brandId);
  if (brandColors) {
    brandColors.delete(colorKey);
  }
}