/**
 * 导出工具（PNG图纸、采购清单）
 */

import type { MappedPixel, ShoppingList, ExportSettings, BrandKey } from '@/types/color';
import { getGridStats } from './pixelEditingUtils';

/**
 * 高精度导出 - 使用3倍分辨率
 */
const EXPORT_SCALE = 3;

/**
 * 格式化色号显示
 */
function formatColorCode(code: string, brandKey: BrandKey): string {
  if (!code) return '';
  switch (brandKey) {
    case 'perler':
      // 去掉前缀，只显示尾数（如 "80-15179" → "15179"）
      const parts = code.split('-');
      return parts[parts.length - 1] || code;
    case 'hama':
      // 只显示数字，去掉H前缀
      return code.replace(/^[HS]/, '');
    case 'artkal':
      // 只显示数字，去掉S前缀
      return code.replace(/^[HS]/, '');
    default:
      return code;
  }
}

/**
 * 获取色号字体大小（基于高分辨率）
 */
function getCodeFontSize(brandKey: BrandKey, scale: number = EXPORT_SCALE): number {
  const baseSize = brandKey === 'perler' ? 4 : 7;
  return baseSize * scale;
}

/**
 * 计算颜色的亮度
 */
function getBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * 根据亮度选择文字颜色
 */
function getTextColor(brightness: number): string {
  return brightness > 128 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)';
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
    const padding = 15 * EXPORT_SCALE;
    const gridSize = settings.showGrid ? 1 * EXPORT_SCALE : 0;

    // 计算调色板尺寸（增大色块）
    const palettePadding = 15 * EXPORT_SCALE;
    const colorBoxSize = 30 * EXPORT_SCALE; // 增大色块
    const textGap = 8 * EXPORT_SCALE;
    const rowGap = 15 * EXPORT_SCALE;
    // 根据画布宽度计算每行显示的色块数量
    const gridWidth = cols * cellSize;
    const itemsPerRow = Math.floor((gridWidth) / (colorBoxSize + textGap + 50 * EXPORT_SCALE));
    const paletteRows = Math.ceil(uniqueColors.length / itemsPerRow);
    const paletteHeight = palettePadding + 25 * EXPORT_SCALE + paletteRows * (colorBoxSize + rowGap);

    // 计算画布尺寸（紧凑布局，减少底部空白）
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

        // 绘制颜色
        const colorHex = pixel?.matchedColor?.hex || pixel?.rgb
          ? `rgb(${pixel.rgb.r}, ${pixel.rgb.g}, ${pixel.rgb.b})`
          : '#FFFFFF';

        ctx.fillStyle = colorHex;
        ctx.fillRect(x, y, cellSize, cellSize);

        // 绘制网格
        if (settings.showGrid) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.lineWidth = gridSize;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        // 绘制坐标（透明背景，根据亮度自动选择黑色或白色，字体更小）
        if (settings.showCoordinates) {
          ctx.font = `${5 * EXPORT_SCALE}px sans-serif`;
          // 根据色块亮度选择文字颜色
          const colorHex = pixel?.matchedColor?.hex || '#FFFFFF';
          const brightness = getBrightness(colorHex);
          ctx.fillStyle = getTextColor(brightness);
          // 添加文字描边增强对比度（透明）
          ctx.strokeStyle = brightness > 128 ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 0.4 * EXPORT_SCALE;
          // 位置调整为左上角，字体大小适合色块
          ctx.strokeText(`${col},${row}`, x + 2 * EXPORT_SCALE, y + 7 * EXPORT_SCALE);
          ctx.fillText(`${col},${row}`, x + 2 * EXPORT_SCALE, y + 7 * EXPORT_SCALE);
        }

        // 绘制色号（透明背景，自动对比度）
        if (settings.showColorCodes && pixel?.matchedColor && cellSize >= 15 * EXPORT_SCALE) {
          const codeText = formatColorCode(pixel.matchedColor.code, brandKey);
          const fontSize = getCodeFontSize(brandKey);
          ctx.font = `${fontSize}px sans-serif`;
          const textWidth = ctx.measureText(codeText).width;
          const textX = x + (cellSize - textWidth) / 2;
          const textY = y + cellSize - 4 * EXPORT_SCALE;

          // 文字颜色根据亮度自动选择（无背景，直接绘制在像素上）
          const brightness = getBrightness(pixel.matchedColor.hex);
          ctx.fillStyle = getTextColor(brightness);
          // 添加文字描边增强对比度
          ctx.strokeStyle = brightness > 128 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1 * EXPORT_SCALE;
          ctx.strokeText(codeText, textX, textY);
          ctx.fillText(codeText, textX, textY);
        }
      }
    }

    // 绘制底部色块调色板
    const paletteY = gridHeight + padding * 2 + palettePadding;
    const paletteStartX = padding;
    const paletteEndX = canvasWidth - padding;
    const totalBeads = uniqueColors.reduce((sum, color) => sum + color.count, 0);

    // 绘制调色板分隔线
    ctx.beginPath();
    ctx.moveTo(paletteStartX, paletteY - 10 * EXPORT_SCALE);
    ctx.lineTo(paletteEndX, paletteY - 10 * EXPORT_SCALE);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2 * EXPORT_SCALE;
    ctx.stroke();

    // 绘制调色板区域标注
    const paletteTopY = paletteY + 5 * EXPORT_SCALE;

    // 左上角：色号调色板：XX种
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = `bold ${14 * EXPORT_SCALE}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`色号调色板：${uniqueColors.length}种`, paletteStartX, paletteTopY);

    // 右上角：共XXX颗
    ctx.textAlign = 'right';
    ctx.fillText(`共${totalBeads}颗`, paletteEndX, paletteTopY);

    // 重置文本对齐
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // 绘制色块（增大面积，显示色号和数量）
    const codeFontSize = 11 * EXPORT_SCALE;
    const countFontSize = 10 * EXPORT_SCALE;

    uniqueColors.forEach((color, index) => {
      const colIndex = index % itemsPerRow;
      const rowIndex = Math.floor(index / itemsPerRow);
      const boxX = paletteStartX + colIndex * (colorBoxSize + textGap + 40 * EXPORT_SCALE);
      const boxY = paletteY + 18 * EXPORT_SCALE + rowIndex * (colorBoxSize + rowGap);

      // 绘制色块背景（阴影效果）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(boxX - 2 * EXPORT_SCALE, boxY - 2 * EXPORT_SCALE, colorBoxSize + 4 * EXPORT_SCALE, colorBoxSize + 4 * EXPORT_SCALE);

      // 绘制色块
      ctx.fillStyle = color.hex;
      ctx.fillRect(boxX, boxY, colorBoxSize, colorBoxSize);

      // 绘制色块边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1 * EXPORT_SCALE;
      ctx.strokeRect(boxX, boxY, colorBoxSize, colorBoxSize);

      // 在色块内绘制色号（居中，自动对比度）
      const displayCode = formatColorCode(color.code, brandKey);
      const brightness = getBrightness(color.hex);
      ctx.fillStyle = getTextColor(brightness);
      ctx.font = `bold ${codeFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 色号在上半部分
      ctx.fillText(displayCode, boxX + colorBoxSize / 2, boxY + colorBoxSize / 2 - 5 * EXPORT_SCALE);

      // 数量在下半部分
      ctx.font = `${countFontSize}px sans-serif`;
      ctx.fillStyle = getTextColor(brightness);
      ctx.fillText(`×${color.count}`, boxX + colorBoxSize / 2, boxY + colorBoxSize / 2 + 10 * EXPORT_SCALE);

      // 重置文本对齐
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
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
  brandName: string,
  brandKey: BrandKey = 'perler'
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
    // 查找颜色信息
    for (const row of grid) {
      for (const pixel of row) {
        if (pixel.color && pixel.color.id === colorId) {
          // CSV导出使用完整色号，不在图片上显示的格式化处理
          return {
            colorCode: pixel.color.code, // 使用完整的原始色号（如 80-15200）
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
      colorCode: 'Unknown',
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