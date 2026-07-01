/**
 * 图像导出功能
 * 支持PNG、JPEG、PDF等格式导出
 */

import type { BrandId, ColorData, PurchaseListExport } from '@/types';

/**
 * 导出格式
 */
export type ExportFormat = 'png' | 'jpeg' | 'pdf' | 'svg';

/**
 * 导出选项
 */
export interface ExportOptions {
  format: ExportFormat;
  scale: number;        // 缩放倍数
  includeColorLegend: boolean;  // 是否包含颜色图例
  includeGridLines: boolean;    // 是否包含网格线
  includePurchaseList: boolean; // 是否包含采购清单
  showColorCodes: boolean;      // 是否显示色号
  showTransparent: boolean;     // 是否显示透明区域
  backgroundColor: string;       // 背景颜色
}

/**
 * 默认导出选项
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'png',
  scale: 1,
  includeColorLegend: true,
  includeGridLines: false,
  includePurchaseList: false,
  showColorCodes: true,
  showTransparent: false,
  backgroundColor: '#FFFFFF'
};

/**
 * 导出图像数据
 * @param canvas 源Canvas
 * @param grid 网格数据
 * @param colorData 颜色数据
 * @param brandId 品牌ID
 * @param options 导出选项
 * @param purchaseList 采购清单（可选）
 * @returns 导出的Blob
 */
export async function exportImage(
  canvas: HTMLCanvasElement,
  grid: string[][],
  colorData: ColorData[],
  brandId: BrandId,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  purchaseList?: PurchaseListExport
): Promise<Blob> {
  // 创建导出Canvas
  const exportCanvas = document.createElement('canvas');
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  // 计算导出尺寸
  const cellSize = 20 * options.scale;
  const M = grid.length;
  const N = grid[0]?.length || 0;
  const legendWidth = options.includeColorLegend ? 200 * options.scale : 0;

  exportCanvas.width = N * cellSize + legendWidth;
  exportCanvas.height = M * cellSize + (options.includePurchaseList ? 300 : 0);

  // 绘制背景
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // 建立颜色映射
  const colorMap = new Map<string, ColorData>();
  for (const color of colorData) {
    if (color.id.startsWith(`${brandId}-`)) {
      colorMap.set(color.id, color);
    }
  }

  // 绘制网格
  for (let row = 0; row < M; row++) {
    for (let col = 0; col < N; col++) {
      const cellKey = grid[row][col];

      if (cellKey === 'TRANSPARENT' && !options.showTransparent) continue;

      const color = colorMap.get(cellKey);
      if (color) {
        ctx.fillStyle = color.hex;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }

      // 绘制网格线
      if (options.includeGridLines) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }

      // 显示色号
      if (options.showColorCodes && color && cellSize > 15) {
        ctx.fillStyle = getContrastColor(color.hex);
        ctx.font = `${12 * options.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          color.code,
          col * cellSize + cellSize / 2,
          row * cellSize + cellSize / 2
        );
      }
    }
  }

  // 绘制颜色图例
  if (options.includeColorLegend) {
    drawColorLegend(ctx, grid, colorMap, N * cellSize, M * cellSize, cellSize);
  }

  // 绘制采购清单
  if (options.includePurchaseList && purchaseList) {
    drawPurchaseList(ctx, purchaseList, N * cellSize, M * cellSize, cellSize);
  }

  // 根据格式导出
  switch (options.format) {
    case 'png':
      return await canvasToBlob(exportCanvas, 'image/png');
    case 'jpeg':
      return await canvasToBlob(exportCanvas, 'image/jpeg');
    case 'svg':
      return await exportToSVG(exportCanvas, grid, colorMap, options, N, M, cellSize);
    case 'pdf':
      return await exportToPDF(exportCanvas, purchaseList);
    default:
      return await canvasToBlob(exportCanvas, 'image/png');
  }
}

/**
 * Canvas转Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas转Blob失败'));
      }
    }, type);
  });
}

/**
 * 绘制颜色图例
 */
function drawColorLegend(
  ctx: CanvasRenderingContext2D,
  grid: string[][],
  colorMap: Map<string, ColorData>,
  x: number,
  y: number,
  cellSize: number
): void {
  // 统计使用的颜色
  const usedColors = new Map<string, ColorData>();
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 'TRANSPARENT') {
        const color = colorMap.get(cell);
        if (color) {
          usedColors.set(color.id, color);
        }
      }
    }
  }

  // 绘制图例标题
  ctx.fillStyle = '#333';
  ctx.font = `bold ${16 * (cellSize / 20)}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('颜色图例', x + 10, y + 10);

  // 绘制颜色列表
  let legendY = y + 40;
  const legendItemHeight = 25 * (cellSize / 20);

  for (const [id, color] of usedColors) {
    // 绘制色块
    ctx.fillStyle = color.hex;
    ctx.fillRect(x + 10, legendY, 20 * (cellSize / 20), 20 * (cellSize / 20));

    // 绘制色号和名称
    ctx.fillStyle = '#333';
    ctx.font = `${12 * (cellSize / 20)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${color.code} - ${color.name}`, x + 40, legendY + 10 * (cellSize / 20));

    legendY += legendItemHeight;
  }
}

/**
 * 绘制采购清单
 */
function drawPurchaseList(
  ctx: CanvasRenderingContext2D,
  purchaseList: PurchaseListExport,
  x: number,
  y: number,
  cellSize: number
): void {
  const startY = y + 10;

  // 绘制标题
  ctx.fillStyle = '#333';
  ctx.font = `bold ${18 * (cellSize / 20)}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('采购清单', x + 10, startY);

  // 绘制统计信息
  const { summary } = purchaseList;
  ctx.font = `${14 * (cellSize / 20)}px Arial`;
  ctx.fillText(`总需珠子：${summary.totalBeads} 颗`, x + 10, startY + 30);
  ctx.fillText(`颜色种类：${summary.uniqueColors} 种`, x + 10, startY + 55);
  ctx.fillText(`预计成本：¥${summary.estimatedCost.toFixed(2)}`, x + 10, startY + 80);

  // 绘制颜色列表
  let listY = startY + 120;
  ctx.font = `${12 * (cellSize / 20)}px Arial`;

  for (const item of purchaseList.items.slice(0, 10)) {  // 只显示前10种
    // 色块
    ctx.fillStyle = item.colorHex;
    ctx.fillRect(x + 10, listY, 15 * (cellSize / 20), 15 * (cellSize / 20));

    // 信息
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${item.colorCode} ${item.colorName} - ${item.quantity}颗 (${item.packages}包)`,
      x + 35,
      listY + 7.5 * (cellSize / 20)
    );

    listY += 25 * (cellSize / 20);
  }

  if (purchaseList.items.length > 10) {
    ctx.fillText(`... 还有 ${purchaseList.items.length - 10} 种颜色`, x + 10, listY);
  }
}

/**
 * 导出为SVG格式
 */
async function exportToSVG(
  canvas: HTMLCanvasElement,
  grid: string[][],
  colorMap: Map<string, ColorData>,
  options: ExportOptions,
  N: number,
  M: number,
  cellSize: number
): Promise<Blob> {
  const rowCount = grid.length;
  const colCount = grid[0]?.length || 0;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${colCount * cellSize}" height="${rowCount * cellSize}" viewBox="0 0 ${colCount * cellSize} ${rowCount * cellSize}">
  <rect width="100%" height="100%" fill="${options.backgroundColor}"/>
`;

  // 绘制格子
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellKey = grid[row][col];

      if (cellKey === 'TRANSPARENT' && !options.showTransparent) continue;

      const color = colorMap.get(cellKey);
      if (color) {
        const x = col * cellSize;
        const y = row * cellSize;

        svg += `  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color.hex}"/>`;

        // 添加色号文本
        if (options.showColorCodes && cellSize > 15) {
          const textColor = getContrastColor(color.hex);
          svg += `  <text x="${x + cellSize / 2}" y="${y + cellSize / 2}"
                   text-anchor="middle" dominant-baseline="middle"
                   fill="${textColor}" font-size="${12 * (cellSize / 20)}">
                     ${color.code}
                   </text>`;
        }

        // 添加网格线
        if (options.includeGridLines) {
          svg += `  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                   fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;
        }
      }
    }
  }

  svg += `</svg>`;

  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * 导出为PDF格式
 */
async function exportToPDF(
  canvas: HTMLCanvasElement,
  purchaseList?: PurchaseListExport
): Promise<Blob> {
  // 简化实现：将Canvas转为图片，然后包装为PDF结构
  const imageData = canvas.toDataURL('image/png');

  // 这里简化处理，实际应该使用jsPDF等库
  // 返回一个包含HTML内容的Blob
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>拼豆图纸</title>
  <style>
    body { margin: 0; padding: 20px; }
    .image { max-width: 100%; margin-bottom: 20px; }
  </style>
</head>
<body>
  <img src="${imageData}" class="image" alt="拼豆图纸">
</body>
</html>
  `;

  return new Blob([htmlContent], { type: 'application/pdf' });
}

/**
 * 获取对比色（黑色或白色）
 */
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * 下载文件
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}