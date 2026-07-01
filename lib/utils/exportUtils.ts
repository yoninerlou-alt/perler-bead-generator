/**
 * 导出工具（PNG图纸、采购清单）
 */

import type { MappedPixel, ShoppingList, ExportSettings } from '@/types/color';
import { getGridStats } from './pixelEditingUtils';

/**
 * 生成PNG图纸
 */
export function generateCanvasExport(
  grid: MappedPixel[][],
  settings: ExportSettings,
  cellSize: number = 20
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    // 计算画布尺寸
    const padding = 20;
    const gridSize = settings.showGrid ? 1 : 0;
    const canvasWidth = cols * cellSize + padding * 2;
    const canvasHeight = rows * cellSize + padding * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 绘制背景
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制像素
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pixel = grid[row]?.[col];
        if (!pixel || !pixel.color) continue;

        const x = padding + col * cellSize;
        const y = padding + row * cellSize;

        // 绘制颜色
        ctx.fillStyle = pixel.color.hex;
        ctx.fillRect(x, y, cellSize, cellSize);

        // 绘制网格
        if (settings.showGrid) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = gridSize;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        // 绘制坐标
        if (settings.showCoordinates) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.font = '8px sans-serif';
          ctx.fillText(`${col},${row}`, x + 2, y + 10);
        }

        // 绘制色号
        if (settings.showColorCodes) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.font = '10px sans-serif';
          ctx.fillText(pixel.color.code, x + 2, y + cellSize - 4);
        }
      }
    }

    // 转换为Blob
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas转换失败'));
      }
    }, 'image/png');
  });
}

/**
 * 生成采购清单
 */
export function generateShoppingList(
  grid: MappedPixel[][],
  brandName: string
): ShoppingList {
  const stats = getGridStats(grid);
  const colorQuantities = new Map<string, number>();

  // 统计每种颜色的数量
  for (const row of grid) {
    for (const pixel of row) {
      if (pixel.color) {
        const count = colorQuantities.get(pixel.color.id) || 0;
        colorQuantities.set(pixel.color.id, count + 1);
      }
    }
  }

  // 生成清单项
  const items = Array.from(colorQuantities.entries()).map(([colorId, quantity]) => {
    const parts = colorId.split('-');
    const code = parts[parts.length - 1];

    // 查找颜色信息
    for (const row of grid) {
      for (const pixel of row) {
        if (pixel.color && pixel.color.id === colorId) {
          return {
            colorCode: code,
            colorName: pixel.color.name,
            colorHex: pixel.color.hex,
            quantity,
            packages: Math.ceil(quantity / 1000), // 假设每包1000粒
            purchaseUrl: pixel.color.purchaseUrl
          };
        }
      }
    }

    // 默认值（理论上不会到达这里）
    return {
      colorCode: code,
      colorName: 'Unknown',
      colorHex: '#000000',
      quantity,
      packages: Math.ceil(quantity / 1000),
      purchaseUrl: ''
    };
  });

  return {
    brand: brandName,
    exportDate: new Date().toISOString(),
    items: items.sort((a, b) => b.quantity - a.quantity), // 按数量降序排列
    summary: {
      totalBeads: stats.totalBeads,
      uniqueColors: stats.uniqueColors,
      estimatedPackages: items.reduce((sum, item) => sum + item.packages, 0)
    }
  };
}

/**
 * 导出采购清单为CSV
 */
export function exportShoppingListToCSV(shoppingList: ShoppingList): string {
  const lines = [
    '色号,颜色名称,HEX,数量,包数,购买链接'
  ];

  for (const item of shoppingList.items) {
    lines.push(
      `${item.colorCode},${item.colorName},${item.colorHex},${item.quantity},${item.packages},${item.purchaseUrl}`
    );
  }

  lines.push('');
  lines.push(`总计,${shoppingList.summary.totalBeads}粒`);
  lines.push(`颜色种类,${shoppingList.summary.uniqueColors}种`);
  lines.push(`预估包数,${shoppingList.summary.estimatedPackages}包`);

  return lines.join('\n');
}

/**
 * 下载PNG文件
 */
export function downloadPNG(blob: Blob, filename: string = 'perler-pattern.png'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 下载CSV文件
 */
export function downloadCSV(csv: string, filename: string = 'shopping-list.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadPNG(blob, filename);
}

/**
 * 下载JSON文件
 */
export function downloadJSON(data: unknown, filename: string = 'data.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8;'
  });
  downloadPNG(blob, filename);
}