/**
 * 采购清单生成算法
 * 统计色号数量、计算包数、估算成本等
 */

import type { BrandId, ColorCategory, PurchaseListItem, PurchaseListExport, ColorData } from '@/types';

/**
 * 包的大小（每包珠子的数量）
 */
export const PACKAGE_SIZE = 100;

/**
 * 各品牌的价格估算（每包价格，单位：元）
 * 这是一个基础估算，实际价格可能因地区和购买渠道而异
 */
export const BRAND_PACKAGE_PRICES: Record<BrandId, number> = {
  perler: 3.5,
  hama: 4.0,
  artkal: 3.0,
  nabbi: 3.5,
  pyssla: 3.0,
  'melty-beads': 2.5
};

/**
 * 采购清单生成选项
 */
export interface PurchaseListOptions {
  includeTransparent: boolean; // 是否包含透明色
  roundUpPackages: boolean;    // 是否向上取整包数
  groupByCategory: boolean;    // 是否按颜色分类分组
  includePurchaseLinks: boolean; // 是否包含购买链接
}

/**
 * 默认采购清单选项
 */
export const DEFAULT_PURCHASE_LIST_OPTIONS: PurchaseListOptions = {
  includeTransparent: false,
  roundUpPackages: true,
  groupByCategory: true,
  includePurchaseLinks: true
};

/**
 * 从网格数据生成采购清单
 * @param grid 网格数据
 * @param colorData 颜色数据
 * @param brandId 品牌ID
 * @param projectName 项目名称
 * @param options 采购清单选项
 * @returns 采购清单
 */
export function generatePurchaseList(
  grid: string[][],
  colorData: ColorData[],
  brandId: BrandId,
  projectName: string,
  options: PurchaseListOptions = DEFAULT_PURCHASE_LIST_OPTIONS
): PurchaseListExport {
  // 统计颜色数量
  const colorCounts = new Map<string, number>();

  for (const row of grid) {
    for (const cell of row) {
      if (cell === 'TRANSPARENT' && !options.includeTransparent) continue;

      const count = colorCounts.get(cell) || 0;
      colorCounts.set(cell, count + 1);
    }
  }

  // 构建采购清单项
  const items: PurchaseListItem[] = [];
  let totalBeads = 0;
  let uniqueColors = 0;

  // 过滤当前品牌的颜色数据
  const brandColors = colorData.filter(
    c => c.id.startsWith(`${brandId}-`)
  );

  // 建立颜色映射
  const colorMap = new Map<string, ColorData>();
  for (const color of brandColors) {
    colorMap.set(color.id, color);
  }

  // 生成采购清单项
  for (const [colorId, quantity] of colorCounts.entries()) {
    const color = colorMap.get(colorId);
    if (!color) continue;

    uniqueColors++;
    totalBeads += quantity;

    // 计算需要的包数
    const packages = options.roundUpPackages
      ? Math.ceil(quantity / PACKAGE_SIZE)
      : Math.floor(quantity / PACKAGE_SIZE);

    const item: PurchaseListItem = {
      brand: brandId,
      colorId: color.id,
      colorCode: color.code,
      colorName: color.name,
      colorHex: color.hex,
      quantity,
      packages,
      category: color.category,
      purchaseUrl: options.includePurchaseLinks ? color.purchaseUrl : undefined
    };

    items.push(item);
  }

  // 按需求分类排序
  if (options.groupByCategory) {
    items.sort((a, b) => {
      // 先按分类排序
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // 分类相同时按数量排序（数量多的在前）
      return b.quantity - a.quantity;
    });
  } else {
    // 按色号排序
    items.sort((a, b) => a.colorCode.localeCompare(b.colorCode));
  }

  // 计算总成本
  const estimatedCost = items.reduce(
    (total, item) => total + item.packages * BRAND_PACKAGE_PRICES[brandId],
    0
  );

  return {
    brand: brandId,
    projectName,
    createdAt: new Date().toISOString(),
    items,
    summary: {
      totalBeads,
      uniqueColors,
      estimatedCost: Math.round(estimatedCost * 100) / 100
    }
  };
}

/**
 * 生成多品牌对比采购清单
 * @param grid 网格数据
 * @param colorData 颜色数据
 * @param brands 要对比的品牌列表
 * @param projectName 项目名称
 * @param options 采购清单选项
 * @returns 多品牌采购清单
 */
export function generateMultiBrandPurchaseLists(
  grid: string[][],
  colorData: ColorData[],
  brands: BrandId[],
  projectName: string,
  options: PurchaseListOptions = DEFAULT_PURCHASE_LIST_OPTIONS
): PurchaseListExport[] {
  const results: PurchaseListExport[] = [];

  for (const brandId of brands) {
    try {
      const purchaseList = generatePurchaseList(
        grid,
        colorData,
        brandId,
        projectName,
        options
      );
      results.push(purchaseList);
    } catch (error) {
      console.error(`生成品牌 ${brandId} 的采购清单失败:`, error);
    }
  }

  return results;
}

/**
 * 寻找最经济的品牌
 * @param purchaseLists 多品牌采购清单
 * @returns 最经济的品牌ID和采购清单
 */
export function findCheapestBrand(
  purchaseLists: PurchaseListExport[]
): { brandId: BrandId; purchaseList: PurchaseListExport } | null {
  if (purchaseLists.length === 0) return null;

  let cheapest = purchaseLists[0];

  for (const purchaseList of purchaseLists) {
    if (purchaseList.summary.estimatedCost < cheapest.summary.estimatedCost) {
      cheapest = purchaseList;
    }
  }

  return {
    brandId: cheapest.brand,
    purchaseList: cheapest
  };
}

/**
 * 生成购买建议
 * @param purchaseList 采购清单
 * @returns 购买建议文本
 */
export function generatePurchaseAdvice(purchaseList: PurchaseListExport): string {
  const { items, summary } = purchaseList;
  const advice: string[] = [];

  advice.push(`📊 项目统计：`);
  advice.push(`   - 总需珠子：${summary.totalBeads} 颗`);
  advice.push(`   - 颜色种类：${summary.uniqueColors} 种`);
  advice.push(`   - 预计成本：¥${summary.estimatedCost.toFixed(2)}`);

  advice.push(`\n🛒 购买建议：`);

  // 按需购买的颜色
  const neededColors = items.filter(item => item.packages > 0);
  if (neededColors.length > 0) {
    advice.push(`   - 需购买 ${neededColors.length} 种颜色的珠子`);
    advice.push(`   - 主要颜色：${neededColors.slice(0, 3).map(c => c.colorName).join('、')}等`);
  }

  // 颜色最多的前5种
  const topColors = items
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  advice.push(`\n🎨 颜色分布 TOP 5：`);
  for (const color of topColors) {
    const percentage = ((color.quantity / summary.totalBeads) * 100).toFixed(1);
    advice.push(`   ${percentage}% - ${color.colorName} (${color.colorCode})`);
  }

  // 包数量最多的颜色
  const mostPackages = items.reduce((max, item) =>
    item.packages > max.packages ? item : max
  );

  advice.push(`\n💡 提示：`);
  advice.push(`   - ${mostPackages.colorName} 需要最多的包 (${mostPackages.packages} 包)`);
  advice.push(`   - 建议优先购买主要颜色，次要颜色可后续补充`);

  return advice.join('\n');
}

/**
 * 优化采购清单（考虑重复使用和备货）
 * @param purchaseList 原始采购清单
 * @param options 优化选项
 * @returns 优化后的采购清单
 */
export interface OptimizationOptions {
  extraBuffer: number;    // 额外备货比例（0-1）
  minPackageBuffer: number;  // 最小包数备货
  mergeSimilarColors: boolean;  // 是否合并相似颜色
}

export const DEFAULT_OPTIMIZATION_OPTIONS: OptimizationOptions = {
  extraBuffer: 0.1,      // 额外10%备货
  minPackageBuffer: 1,   // 每种颜色至少1包备货
  mergeSimilarColors: false
};

export function optimizePurchaseList(
  purchaseList: PurchaseListExport,
  options: OptimizationOptions = DEFAULT_OPTIMIZATION_OPTIONS
): PurchaseListExport {
  const optimized = { ...purchaseList };
  const optimizedItems: PurchaseListItem[] = [];

  for (const item of purchaseList.items) {
    let adjustedQuantity = item.quantity;

    // 应用额外备货比例
    adjustedQuantity = Math.floor(adjustedQuantity * (1 + options.extraBuffer));

    // 计算包数
    let packages = Math.ceil(adjustedQuantity / PACKAGE_SIZE);

    // 应用最小包数备货
    if (packages < options.minPackageBuffer) {
      packages = options.minPackageBuffer;
    }

    optimizedItems.push({
      ...item,
      quantity: adjustedQuantity,
      packages
    });
  }

  optimized.items = optimizedItems;

  // 重新计算统计数据
  optimized.summary = {
    totalBeads: optimizedItems.reduce((sum, item) => sum + item.quantity, 0),
    uniqueColors: optimizedItems.length,
    estimatedCost: optimizedItems.reduce(
      (sum, item) => sum + item.packages * BRAND_PACKAGE_PRICES[purchaseList.brand],
      0
    )
  };

  return optimized;
}

/**
 * 导出采购清单为CSV格式
 * @param purchaseList 采购清单
 * @returns CSV字符串
 */
export function purchaseListToCSV(purchaseList: PurchaseListExport): string {
  const headers = [
    '色号',
    '颜色名称',
    '颜色HEX',
    '需求数量',
    '包数',
    '购买链接'
  ];

  const rows = purchaseList.items.map(item => [
    item.colorCode,
    item.colorName,
    item.colorHex,
    item.quantity.toString(),
    item.packages.toString(),
    item.purchaseUrl || ''
  ]);

  const summary = [
    '',
    '',
    '',
    '',
    ''
  ];
  summary.push(`总计珠子：${purchaseList.summary.totalBeads}`);
  summary.push(`颜色种类：${purchaseList.summary.uniqueColors}`);
  summary.push(`预计成本：¥${purchaseList.summary.estimatedCost.toFixed(2)}`);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    ...summary
  ].join('\n');

  return csvContent;
}

/**
 * 导出采购清单为JSON格式
 * @param purchaseList 采购清单
 * @returns JSON字符串
 */
export function purchaseListToJSON(purchaseList: PurchaseListExport): string {
  return JSON.stringify(purchaseList, null, 2);
}

/**
 * 生成采购清单HTML报告
 * @param purchaseList 采购清单
 * @returns HTML字符串
 */
export function purchaseListToHTML(purchaseList: PurchaseListExport): string {
  const advice = generatePurchaseAdvice(purchaseList);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${purchaseList.projectName} - 采购清单</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #4CAF50; color: white; }
    .color-swatch { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; }
    .advice { background: #e3f2fd; padding: 15px; border-radius: 8px; white-space: pre-line; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${purchaseList.projectName}</h1>
    <p>品牌：${purchaseList.brand.toUpperCase()} | 生成时间：${new Date(purchaseList.createdAt).toLocaleString('zh-CN')}</p>
  </div>

  <div class="summary">
    <h3>📊 项目统计</h3>
    <p>总需珠子：${purchaseList.summary.totalBeads} 颗</p>
    <p>颜色种类：${purchaseList.summary.uniqueColors} 种</p>
    <p>预计成本：¥${purchaseList.summary.estimatedCost.toFixed(2)}</p>
  </div>

  <h3>🛒 采购清单</h3>
  <table>
    <thead>
      <tr>
        <th>色号</th>
        <th>颜色</th>
        <th>颜色名称</th>
        <th>数量</th>
        <th>包数</th>
      </tr>
    </thead>
    <tbody>
      ${purchaseList.items.map(item => `
        <tr>
          <td>${item.colorCode}</td>
          <td><div class="color-swatch" style="background-color: ${item.colorHex};"></div></td>
          <td>${item.colorName}</td>
          <td>${item.quantity}</td>
          <td>${item.packages}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="advice">
    <h3>💡 购买建议</h3>
    ${advice}
  </div>

  <div class="footer">
    <p>由拼豆图纸生成器自动生成 | 仅供参考，实际购买请以实际情况为准</p>
  </div>
</body>
</html>
  `.trim();
}