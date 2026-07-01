/**
 * 颜色系统类型定义
 */

export type BrandId =
  | 'perler'
  | 'hama'
  | 'artkal'
  | 'nabbi'
  | 'pyssla'
  | 'melty-beads';

export type ColorCategory =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'black-gray'
  | 'white'
  | 'transparent'
  | 'special';

/**
 * 颜色数据结构
 */
export interface ColorData {
  id: string;           // 品牌ID-色号 (如 "perler-019")
  code: string;           // 官方色号
  name: string;           // 颜色名称
  hex: string;             // 十六进制颜色
  rgb: [number, number, number]; // RGB值 [r, g, b] (0-255)
  lab?: [number, number, number]; // CIELAB值 [L, a, b] (可选，推荐)
  category: ColorCategory; // 颜色分类
  popularity?: number;       // 流行度评分 (0-100)
  discontinued?: boolean;     // 是否停产
  alternativeIds?: BrandId[]; // 其他品牌对应色号
  purchaseUrl?: string;    // 购买页面URL
  hexSource?: 'verified' | 'estimated'; // 数据来源
}

/**
 * 品牌信息结构
 */
export interface Brand {
  id: BrandId;
  name: string;          // 品牌英文名
  displayName: string;   // 显示名称
  region: 'north-america' | 'europe' | 'global' | 'asia';
  totalColors: number;
  beadSize: number;     // 拼豆尺寸 (mm)
  gridSize: number;      // 网格尺寸 (beads/cm)
  website: string;      // 官方网站
  shopUrl: string;       // 购买页面
  officialDocs?: string; // 官方色号文档
  logo?: string;        // Logo文件路径
}

/**
 * 颜色映射数据结构
 */
export interface ColorMapping {
  hex: string;                    // 十六进制颜色 (统一键值)
  brands: Record<BrandId, string>;  // 各品牌对应的色号 (nullable表示该品牌没有此颜色)
}

/**
 * 像素化模式
 */
export enum PixelationMode {
  Dominant = 'dominant', // 主导色模式（避免灰色毛边）
  Average = 'average'   // 平均色模式（更好的渐变）
}

/**
 * RGB颜色值
 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * 像素数据（映射后的单个格子）
 */
export interface MappedPixel {
  key: string;           // 品牌ID-色号 (如 "perler-019")
  color: string;          // 十六进制颜色
  isExternal?: boolean;  // 是否为外部背景
}

/**
 * 颜色映射结果
 */
export interface ColorMappingResult {
  pixels: MappedPixel[][];
  usedColors: Map<string, number>;  // 色号ID -> 数量
  excludedColors: string[];              // 被排除的颜色ID
  statistics: {
    totalPixels: number;
    uniqueColors: number;
    averageConfidence: number;
    maxDistance: number;
  };
}

/**
 * 采购清单项
 */
export interface PurchaseListItem {
  brand: BrandId;
  colorId: string;    // 品牌ID-色号
  colorCode: string;   // 色号
  colorName: string;  // 颜色名称
  colorHex: string;   // 十六进制
  quantity: number;    // 需要数量
  packages: number;     // 需要包数（每包100颗）
  category: ColorCategory;
  purchaseUrl?: string; // 购买链接
}

/**
 * 采购清单导出
 */
export interface PurchaseListExport {
  brand: BrandId;
  projectName: string;
  createdAt: string;
  items: PurchaseListItem[];
  summary: {
    totalBeads: number;
    uniqueColors: number;
    estimatedCost: number;  // 估算成本
  };
}

/**
 * 放大镜工具
 */
export interface MagnifierArea {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * 编辑模式
 */
export type EditMode = 'none' | 'color' | 'erase' | 'bucket' | 'magnifier';

/**
 * 撤回快照
 */
export interface EditSnapshot {
  mappedPixelData: MappedPixel[][];
  colorCounts: Record<string, { count: number; color: string }>;
  totalBeadCount: number;
}