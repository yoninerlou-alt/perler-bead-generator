/**
 * 导出工具（PNG图纸、采购清单）
 */

import type { MappedPixel, ShoppingList, ExportSettings, BrandKey } from '@/types/color';
import { getGridStats } from './pixelEditingUtils';

/**
 * 高精度导出 - 使用2倍分辨率
 */
const EXPORT_SCALE = 2;

/**
 * 格式化色号显示
 */
function formatColorCode(code: string, brandKey: BrandKey): string {
  if (!code) return '';
  switch (brandKey) {
    case 'hama':
      // 只显示数字，去掉H前缀
      return code.replace(/^[HS]/, '');
    case 'artkal':
      // 只显示数字，去掉S前缀
      return code.replace(/^[HS]/, '');
    case 'perler':
    default:
      return code;
  }
}

/**
 * 获取色号字体大小（基于高分辨率）
 */
function getCodeFontSize(brandKey: BrandKey, scale: number = EXPORT_SCALE): number {
  const baseSize = brandKey === 'perler' ? 6 : 9;
  return baseSize * scale;
}

/**
 * 获取唯一颜色列表
 */
function getUniqueColors(grid: MappedPixel[][]): Array<{
  id: string;
  code: string;
  name: string;
  hex: string;
  count: number;
}> {
  const colorMap = new Map<string, { id: string; code: string; name: string; hex: string; count: number }>();

  for (const row of grid) {
    for (const pixel of row) {
      if (pixel.color) {
        const existing = colorMap.get(pixel.color.id);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(pixel.color.id, {
            id: pixel.color.id,
            code: pixel.color.code,
            name: pixel.color.name,
            hex: pixel.color.hex,
            count: 1
          });
        }
      }
    }
  }

  return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * 生成PNG图纸（高精度 + 底部色块调色板）
 */
export function generateCanvasExport(
  grid: MappedPixel[][],
  settings: ExportSettings,
  brandKey: BrandKey = 'perler',
  baseCellSize: number = 20
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const uniqueColors = getUniqueColors(grid);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    // 高精度缩放
    const cellSize = baseCellSize * EXPORT_SCALE;
    const padding = 20 * EXPORT_SCALE;
    const gridSize = settings.showGrid ? EXPORT_SCALE : 0;
    const paletteHeight = Math.max(100 * EXPORT_SCALE, (uniqueColors.length + 1) * 30 * EXPORT_SCALE);

    // 计算画布尺寸
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    const canvasWidth = gridWidth + padding * 2;
    const canvasHeight = gridHeight + padding * 2 + paletteHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 绘制背景
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制主网格
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pixel = grid[row]?.[col];
        const x = padding + col * cellSize;
        const y = padding + row * cellSize;

        // 绘制颜色（修复颜色缺损：使用rgb值作为fallback）
        const colorHex = pixel?.matchedColor?.hex || pixel?.rgb
          ? `rgb(${pixel.rgb.r}, ${pixel.rgb.g}, ${pixel.rgb.b})`
          : '#FFFFFF';

        ctx.fillStyle = colorHex;
        ctx.fillRect(x, y, cellSize, cellSize);

        // 绘制网格
        if (settings.showGrid) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = gridSize;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        // 绘制坐标
        if (settings.showCoordinates) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.font = `${10 * EXPORT_SCALE}px sans-serif`;
          ctx.fillText(`${col},${row}`, x + 4 * EXPORT_SCALE, y + 14 * EXPORT_SCALE);
        }

        // 绘制色号
        if (settings.showColorCodes && pixel?.matchedColor) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 2 * EXPORT_SCALE;
          const codeText = formatColorCode(pixel.matchedColor.code, brandKey);
          const fontSize = getCodeFontSize(brandKey);
          ctx.font = `${fontSize}px sans-serif`;
          const textWidth = ctx.measureText(codeText).width;
          const paddingX = 3 * EXPORT_SCALE;
          const paddingY = 2 * EXPORT_SCALE;

          // 绘制文字背景
          const textX = x + cellSize / 2;
          const textY = y + cellSize - 6 * EXPORT_SCALE;
          ctx.fillRect(
            textX - textWidth / 2 - paddingX,
            textY - fontSize - paddingY,
            textWidth + paddingX * 2,
            fontSize + paddingY * 2
          );
          ctx.strokeRect(
            textX - textWidth / 2 - paddingX,
            textY - fontSize - paddingY,
            textWidth + paddingX * 2,
            fontSize + paddingY * 2
          );

          // 绘制文字
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillText(codeText, textX - textWidth / 2, textY);
        }
      }
    }

    // 绘制底部色块调色板
    const paletteY = gridHeight + padding * 2 + 20 * EXPORT_SCALE;
    const paletteStartX = padding;
    const paletteEndX = canvasWidth - padding;
    const paletteWidth = paletteEndX - paletteStartX;

    // 绘制调色板分隔线
    ctx.beginPath();
    ctx.moveTo(paletteStartX, paletteY - 10 * EXPORT_SCALE);
    ctx.lineTo(paletteEndX, paletteY - 10 * EXPORT_SCALE);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2 * EXPORT_SCALE;
    ctx.stroke();

    // 绘制调色板标题
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = `bold ${14 * EXPORT_SCALE}px sans-serif`;
    ctx.fillText(`色号调色板 (${uniqueColors.length}种)`, paletteStartX, paletteY);

    // 计算调色板布局
    const colorBoxSize = 24 * EXPORT_SCALE;
    const colorGap = 8 * EXPORT_SCALE;
    const textGap = 6 * EXPORT_SCALE;
    const rowGap = 12 * EXPORT_SCALE;
    const maxCols = Math.floor((paletteWidth) / (colorBoxSize + textGap + 40 * EXPORT_SCALE));

    // 绘制色块
    uniqueColors.forEach((color, index) => {
      const colIndex = index % maxCols;
      const rowIndex = Math.floor(index / maxCols);
      const boxX = paletteStartX + colIndex * (colorBoxSize + textGap + 40 * EXPORT_SCALE);
      const boxY = paletteY + 20 * EXPORT_SCALE + rowIndex * (colorBoxSize + rowGap);

      // 绘制色块边框
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(boxX - 2 * EXPORT_SCALE, boxY - 2 * EXPORT_SCALE, colorBoxSize + 4 * EXPORT_SCALE, colorBoxSize + 4 * EXPORT_SCALE);

      // 绘制色块
      ctx.fillStyle = color.hex;
      ctx.fillRect(boxX, boxY, colorBoxSize, colorBoxSize);

      // 绘制色块边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1 * EXPORT_SCALE;
      ctx.strokeRect(boxX, boxY, colorBoxSize, colorBoxSize);

      // 绘制色号
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = `${11 * EXPORT_SCALE}px sans-serif`;
      const displayCode = formatColorCode(color.code, brandKey);
      ctx.fillText(displayCode, boxX + colorBoxSize + textGap, boxY + colorBoxSize / 2 + 4 * EXPORT_SCALE);

      // 绘制颜色名称（截断）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.font = `${9 * EXPORT_SCALE}px sans-serif`;
      const maxNameWidth = 35 * EXPORT_SCALE;
      let displayName = color.name;
      if (ctx.measureText(displayName).width > maxNameWidth) {
        while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      ctx.fillText(displayName, boxX + colorBoxSize + textGap, boxY + colorBoxSize / 2 + 18 * EXPORT_SCALE);
    });

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
 * 导出采购清单为CSV（增加品牌名称）
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
  lines.push(`品牌,${shoppingList.brand}`);
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