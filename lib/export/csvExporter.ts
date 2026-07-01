/**
 * CSV导出功能
 * 支持导出采购清单和色板数据
 */

import type { PurchaseListExport, ColorData, BrandId } from '@/types';

/**
 * 导出采购清单为CSV
 * @param purchaseList 采购清单
 * @param options 导出选项
 * @returns CSV字符串
 */
export interface CSVExportOptions {
  includeHeader: boolean;
  includeSummary: boolean;
  delimiter: string;
  encoding: 'utf-8' | 'gbk';
}

export const DEFAULT_CSV_OPTIONS: CSVExportOptions = {
  includeHeader: true,
  includeSummary: true,
  delimiter: ',',
  encoding: 'utf-8'
};

export function exportPurchaseListToCSV(
  purchaseList: PurchaseListExport,
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const rows: string[][] = [];

  // 添加标题
  if (options.includeHeader) {
    rows.push([
      '色号',
      '颜色名称',
      '颜色HEX',
      '需求数量',
      '包数',
      '购买链接'
    ]);
  }

  // 添加数据行
  for (const item of purchaseList.items) {
    rows.push([
      item.colorCode,
      item.colorName,
      item.colorHex,
      item.quantity.toString(),
      item.packages.toString(),
      item.purchaseUrl || ''
    ]);
  }

  // 添加统计信息
  if (options.includeSummary) {
    rows.push([]);
    rows.push(['统计信息']);
    rows.push(['总计珠子', purchaseList.summary.totalBeads.toString()]);
    rows.push(['颜色种类', purchaseList.summary.uniqueColors.toString()]);
    rows.push(['预计成本', `¥${purchaseList.summary.estimatedCost.toFixed(2)}`]);
    rows.push(['项目名称', purchaseList.projectName]);
    rows.push(['品牌', purchaseList.brand]);
    rows.push(['生成时间', new Date(purchaseList.createdAt).toLocaleString('zh-CN')]);
  }

  // 转换为CSV格式
  return rowsToCSV(rows, options.delimiter);
}

/**
 * 导出色板数据为CSV
 * @param colorData 颜色数据
 * @param brandId 品牌ID
 * @param options 导出选项
 * @returns CSV字符串
 */
export function exportColorPaletteToCSV(
  colorData: ColorData[],
  brandId: BrandId,
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const rows: string[][] = [];
  const brandColors = colorData.filter(c => c.id.startsWith(`${brandId}-`));

  // 添加标题
  if (options.includeHeader) {
    rows.push([
      '色号',
      '颜色名称',
      'HEX值',
      'RGB值',
      '分类',
      '是否停产',
      '购买链接'
    ]);
  }

  // 添加数据行
  for (const color of brandColors) {
    const rgb = color.rgb.join(',');
    rows.push([
      color.code,
      color.name,
      color.hex,
      rgb,
      color.category,
      color.discontinued ? '是' : '否',
      color.purchaseUrl || ''
    ]);
  }

  // 添加统计信息
  if (options.includeSummary) {
    rows.push([]);
    rows.push(['色板统计']);
    rows.push(['品牌', brandId]);
    rows.push(['颜色数量', brandColors.length.toString()]);
    rows.push(['分类统计', getCategoryStats(brandColors)]);
  }

  return rowsToCSV(rows, options.delimiter);
}

/**
 * 导出网格数据为CSV
 * @param grid 网格数据
 * @param options 导出选项
 * @returns CSV字符串
 */
export function exportGridToCSV(
  grid: string[][],
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const rows: string[][] = [];

  for (const row of grid) {
    rows.push([...row]);
  }

  return rowsToCSV(rows, options.delimiter);
}

/**
 * 将行数组转换为CSV字符串
 */
function rowsToCSV(rows: string[][], delimiter: string): string {
  return rows.map(row =>
    row.map(cell =>
      // 如果包含分隔符、引号或换行符，需要用引号包裹并转义内部引号
      cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')
        ? `"${cell.replace(/"/g, '""')}"`
        : cell
    ).join(delimiter)
  ).join('\n');
}

/**
 * 获取颜色分类统计
 */
function getCategoryStats(colorData: ColorData[]): string {
  const categoryCount = new Map<string, number>();

  for (const color of colorData) {
    const count = categoryCount.get(color.category) || 0;
    categoryCount.set(color.category, count + 1);
  }

  return Array.from(categoryCount)
    .map(([cat, count]) => `${cat}:${count}`)
    .join(', ');
}

/**
 * 下载CSV文件
 */
export function downloadCSV(
  csvContent: string,
  filename: string,
  encoding: 'utf-8' | 'gbk' = 'utf-8'
): void {
  const blob = new Blob(['﻿' + csvContent], { type: `text/csv;charset=${encoding}` });
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
 * 导出为Excel兼容格式
 */
export function exportToExcelFormat(csvContent: string): string {
  // Excel需要特定的格式才能正确显示中文
  return '﻿' + csvContent;
}