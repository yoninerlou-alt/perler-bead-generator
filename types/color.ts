/**
 * 颜色相关类型定义
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

export interface BeadColor {
  id: string;
  code: string;
  name: string;
  hex: string;
  rgb: RgbColor;
  lab: LabColor;
  category: ColorCategory;
  purchaseUrl: string;
  discontinued: boolean;
  contributor?: string;
}

export type ColorCategory =
  | 'solid'
  | 'pastel'
  | 'neon'
  | 'metallic'
  | 'glitter'
  | 'translucent';

export interface BrandColorSystem {
  brandId: string;
  brandName: string;
  displayName: string;
  totalColors: number;
  beadSize: number;
  colorData: BeadColor[];
}

export interface ColorSystemMapping {
  perler: BrandColorSystem;
  hama: BrandColorSystem;
  artkal: BrandColorSystem;
}

export type BrandKey = keyof ColorSystemMapping;

export interface Pixel {
  row: number;
  col: number;
  color: BeadColor | null;
}

export interface MappedPixel extends Pixel {
  rgb: RgbColor;
  lab: LabColor;
  matchedColor: BeadColor | null;
  distance: number;
}

export interface GridDimensions {
  N: number;
  M: number;
}

export type PixelationMode = 'dominant' | 'average' | 'weighted';

export interface ExportSettings {
  showGrid: boolean;
  showCoordinates: boolean;
  showColorCodes: boolean;
  gridSize: number;
  backgroundColor: string;
}

export interface ShoppingListItem {
  colorCode: string;
  colorName: string;
  colorHex: string;
  quantity: number;
  packages: number;
  purchaseUrl: string;
}

export interface ShoppingList {
  brand: string;
  exportDate: string;
  items: ShoppingListItem[];
  summary: {
    totalBeads: number;
    uniqueColors: number;
    estimatedPackages: number;
  };
}

/**
 * 编辑工具类型
 */
export type EditTool = 'brush' | 'eraser' | 'fill' | 'picker';

/**
 * 编辑历史记录
 */
export interface EditHistory {
  grid: MappedPixel[][];
  action: string;
  timestamp: number;
}