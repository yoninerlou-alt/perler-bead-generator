/**
 * 色号数据管理模块
 * 加载、管理和查询品牌色号数据
 */

import type { BrandId, ColorData, Brand, ColorCategory } from '@/types';

/**
 * 色号数据加载器
 */
export class ColorDataManager {
  private colorDataCache: Map<BrandId, ColorData[]> = new Map();
  private brandInfoCache: Map<BrandId, Brand> = new Map();
  private colorMappingCache: Map<string, ColorData> = new Map(); // hex -> ColorData

  /**
   * 加载品牌色号数据
   */
  async loadBrandColors(brandId: BrandId): Promise<ColorData[]> {
    if (this.colorDataCache.has(brandId)) {
      return this.colorDataCache.get(brandId)!;
    }

    try {
      const data = await this.fetchBrandData(brandId);
      this.colorDataCache.set(brandId, data);

      // 建立颜色映射
      for (const color of data) {
        this.colorMappingCache.set(color.hex.toLowerCase(), color);
      }

      return data;
    } catch (error) {
      console.error(`加载品牌 ${brandId} 数据失败:`, error);
      throw new Error(`无法加载 ${brandId} 品牌的色号数据`);
    }
  }

  /**
   * 加载所有品牌数据
   */
  async loadAllBrands(brandIds: BrandId[]): Promise<Map<BrandId, ColorData[]>> {
    const results = new Map<BrandId, ColorData[]>();

    const promises = brandIds.map(async (brandId) => {
      const colors = await this.loadBrandColors(brandId);
      results.set(brandId, colors);
      return { brandId, colors };
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 获取品牌信息
   */
  async loadBrandInfo(brandId: BrandId): Promise<Brand> {
    if (this.brandInfoCache.has(brandId)) {
      return this.brandInfoCache.get(brandId)!;
    }

    const brandInfo = await this.fetchBrandInfo(brandId);
    this.brandInfoCache.set(brandId, brandInfo);

    return brandInfo;
  }

  /**
   * 获取指定品牌的调色板
   */
  async getPalette(brandId: BrandId): Promise<Array<{
    key: string;
    color: string;
    rgb: [number, number, number];
    brand: BrandId;
    code: string;
    name: string;
    hex: string;
  }>> {
    const colors = await this.loadBrandColors(brandId);

    return colors.map(color => ({
      key: color.id,
      color: color.hex,
      rgb: this.rgbToLab({ r: color.rgb[0], g: color.rgb[1], b: color.rgb[2] }),
      brand: brandId,
      code: color.code,
      name: color.name,
      hex: color.hex
    }));
  }

  /**
   * 查找颜色
   */
  async findColorByHex(hex: string, brandId?: BrandId): Promise<ColorData | null> {
    const normalizedHex = hex.toLowerCase().replace('#', '');

    if (brandId) {
      const colors = await this.loadBrandColors(brandId);
      return colors.find(c => c.hex.toLowerCase() === normalizedHex) || null;
    }

    return this.colorMappingCache.get(normalizedHex) || null;
  }

  /**
   * 查找相似颜色
   */
  async findSimilarColors(
    hex: string,
    brandId: BrandId,
    threshold: number = 15,
    maxResults: number = 5
  ): Promise<ColorData[]> {
    const colors = await this.loadBrandColors(brandId);
    const targetRgb = this.hexToRgb(hex);

    if (!targetRgb) return [];

    const targetLab = this.rgbToLab(targetRgb);

    const similarities = colors.map(color => ({
      color,
      distance: this.calculateDeltaE(
        targetLab,
        this.rgbToLab({ r: color.rgb[0], g: color.rgb[1], b: color.rgb[2] })
      )
    }));

    similarities.sort((a, b) => a.distance - b.distance);

    return similarities
      .filter(s => s.distance < threshold)
      .slice(0, maxResults)
      .map(s => s.color);
  }

  /**
   * 按分类获取颜色
   */
  async getColorsByCategory(
    category: ColorCategory,
    brandId: BrandId
  ): Promise<ColorData[]> {
    const colors = await this.loadBrandColors(brandId);
    return colors.filter(c => c.category === category);
  }

  /**
   * 获取所有分类
   */
  async getCategories(brandId: BrandId): Promise<ColorCategory[]> {
    const colors = await this.loadBrandColors(brandId);
    const categories = new Set<ColorCategory>();

    for (const color of colors) {
      categories.add(color.category);
    }

    return Array.from(categories);
  }

  /**
   * 清除缓存
   */
  clearCache(brandId?: BrandId): void {
    if (brandId) {
      this.colorDataCache.delete(brandId);
      this.brandInfoCache.delete(brandId);
    } else {
      this.colorDataCache.clear();
      this.brandInfoCache.clear();
      this.colorMappingCache.clear();
    }
  }

  /**
   * 验证数据完整性
   */
  async validateData(brandId: BrandId): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const colors = await this.loadBrandColors(brandId);
    const errors: string[] = [];
    const warnings: string[] = [];

    const hexSet = new Set<string>();
    const codeSet = new Set<string>();

    for (const color of colors) {
      // 验证HEX格式
      if (!/^#[0-9A-Fa-f]{6}$/.test(color.hex)) {
        errors.push(`颜色 ${color.id} 的HEX值格式错误: ${color.hex}`);
      }

      // 检查重复HEX
      if (hexSet.has(color.hex.toLowerCase())) {
        warnings.push(`颜色 ${color.id} 的HEX值重复: ${color.hex}`);
      }
      hexSet.add(color.hex.toLowerCase());

      // 检查重复色号
      if (codeSet.has(color.code)) {
        errors.push(`重复的色号: ${color.code}`);
      }
      codeSet.add(color.code);

      // 验证RGB值范围
      const [r, g, b] = color.rgb;
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
        errors.push(`颜色 ${color.id} 的RGB值超出范围: [${r}, ${g}, ${b}]`);
      }

      // 验证分类
      if (!this.isValidCategory(color.category)) {
        errors.push(`颜色 ${color.id} 的分类无效: ${color.category}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ========== 私有方法 ==========

  /**
   * 从API或本地获取品牌数据
   */
  private async fetchBrandData(brandId: BrandId): Promise<ColorData[]> {
    // 首先尝试从本地JSON文件加载
    try {
      const response = await fetch(`/data/colors/${brandId}.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`无法从本地加载 ${brandId} 数据，尝试其他来源`);
    }

    // 尝试从BeadColors项目获取
    try {
      const response = await fetch(
        `https://beadcolors.eremes.xyz/raw/${brandId}.csv`
      );

      if (response.ok) {
        const csvText = await response.text();
        return this.parseBeadColorsCSV(csvText, brandId);
      }
    } catch (error) {
      console.log(`无法从 BeadColors 获取 ${brandId} 数据`);
    }

    // 返回空数组（调用方需要处理）
    throw new Error(`无法找到 ${brandId} 品牌的色号数据`);
  }

  /**
   * 从API或本地获取品牌信息
   */
  private async fetchBrandInfo(brandId: BrandId): Promise<Brand> {
    const brandInfos: Record<BrandId, Brand> = {
      perler: {
        id: 'perler',
        name: 'Perler',
        displayName: 'Perler Beads',
        region: 'north-america',
        totalColors: 103,
        beadSize: 5.0,
        gridSize: 20,
        website: 'https://perler.com',
        shopUrl: 'https://perler.com/collections/fuse-beads'
      },
      hama: {
        id: 'hama',
        name: 'Hama',
        displayName: 'Hama Beads',
        region: 'europe',
        totalColors: 92,
        beadSize: 5.0,
        gridSize: 20,
        website: 'https://hama.dk',
        shopUrl: 'https://hama.dk/en/collections/midi-beads'
      },
      artkal: {
        id: 'artkal',
        name: 'Artkal',
        displayName: 'Artkal Beads',
        region: 'global',
        totalColors: 199,
        beadSize: 5.0,
        gridSize: 20,
        website: 'https://artkalfusebeads.com',
        shopUrl: 'https://artkalfusebeads.com/collections/midi-beads'
      },
      nabbi: {
        id: 'nabbi',
        name: 'Nabbi',
        displayName: 'Nabbi Beads',
        region: 'europe',
        totalColors: 0,
        beadSize: 5.0,
        gridSize: 20,
        website: 'https://nabbi.dk',
        shopUrl: 'https://nabbi.dk'
      },
      pyssla: {
        id: 'pyssla',
        name: 'Pyssla',
        displayName: 'Pyssla Beads',
        region: 'europe',
        totalColors: 0,
        beadSize: 5.0,
        gridSize: 20,
        website: 'https://ikea.com',
        shopUrl: 'https://ikea.com'
      },
      'melty-beads': {
        id: 'melty-beads',
        name: 'Melty Beads',
        displayName: 'Melty Beads',
        region: 'global',
        totalColors: 0,
        beadSize: 5.0,
        gridSize: 20,
        website: 'https://meltybeads.com',
        shopUrl: 'https://meltybeads.com'
      }
    };

    return brandInfos[brandId];
  }

  /**
   * 解析BeadColors CSV格式
   */
  private parseBeadColorsCSV(csvText: string, brandId: BrandId): ColorData[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const colorData: ColorData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      const r = parseInt(row.rgb_r || row.r || '0', 10);
      const g = parseInt(row.rgb_g || row.g || '0', 10);
      const b = parseInt(row.rgb_b || row.b || '0', 10);

      const code = row.code || row.reference_code || '';
      const name = row.name || row.Color || '';
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();

      const color: ColorData = {
        id: `${brandId}-${code}`,
        code,
        name,
        hex,
        rgb: [r, g, b],
        lab: this.rgbToLab({ r, g, b }),
        category: this.inferCategory(name, hex),
        discontinued: false,
        hexSource: 'verified'
      };

      colorData.push(color);
    }

    return colorData;
  }

  /**
   * RGB转Lab
   */
  private rgbToLab(rgb: { r: number; g: number; b: number; a?: number }): [number, number, number] {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const bBlue = rgb.b / 255;

    const toLinear = (c: number): number =>
      c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    const linearR = toLinear(r);
    const linearG = toLinear(g);
    const linearB = toLinear(bBlue);

    const x = 0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB;
    const y = 0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB;
    const z = 0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB;

    const lRoot = Math.cbrt(x);
    const mRoot = Math.cbrt(y);
    const sRoot = Math.cbrt(z);

    const lRootValue = lRoot / Math.cbrt(0.96422) * 116;
    const mRootValue = mRoot / Math.cbrt(0.825) * 100;
    const sRootValue = sRoot / Math.cbrt(0.787) * 100;

    const l = 0.2104542553 * lRootValue + 0.7936177850 * mRootValue - 0.0040720468 * sRootValue;
    const a = 1.9779984951 * lRootValue - 2.4285922050 * mRootValue + 0.4505937099 * sRootValue;
    const b = 0.0259040371 * lRootValue + 0.7827717662 * mRootValue - 0.8086757660 * sRootValue;

    return [l, a, b];
  }

  /**
   * 计算Delta E
   */
  private calculateDeltaE(
    lab1: [number, number, number],
    lab2: [number, number, number]
  ): number {
    const dl = lab1[0] - lab2[0];
    const da = lab1[1] - lab2[1];
    const db = lab1[2] - lab2[2];

    return Math.sqrt(dl * dl + da * da + db * db);
  }

  /**
   * HEX转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/i.exec(hex);
    if (!match) return null;

    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16)
    };
  }

  /**
   * 推断颜色分类
   */
  private inferCategory(name: string, hex: string): ColorCategory {
    const nameLower = name.toLowerCase();

    // 透明色
    if (nameLower.includes('transparent') || nameLower.includes('clear')) {
      return 'transparent';
    }

    // 霓虹色/荧光色
    if (nameLower.includes('glow') || nameLower.includes('neon')) {
      return 'special';
    }

    // 金属色
    if (nameLower.includes('metallic') || nameLower.includes('sparkle')) {
      return 'special';
    }

    // 珍珠色
    if (nameLower.includes('pearl')) {
      return 'special';
    }

    const rgb = this.hexToRgb(hex);
    if (!rgb) return 'special';

    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const diff = max - min;

    // 黑灰白
    if (diff === 0 || diff < 10) {
      if (max < 30) return 'black-gray';
      if (max > 230) return 'white';
      return 'black-gray';
    }

    // 彩色
    if (max === rgb.r) {
      if (rgb.g > rgb.b * 1.5) return 'orange';
      if (rgb.b > rgb.g * 1.5) return 'purple';
      return 'red';
    }

    if (max === rgb.g) {
      if (rgb.r > rgb.b * 1.5) return 'yellow';
      return 'green';
    }

    if (max === rgb.b) {
      if (rgb.r > rgb.g * 1.5) return 'purple';
      return 'blue';
    }

    return 'special';
  }

  /**
   * 验证分类是否有效
   */
  private isValidCategory(category: string): category is ColorCategory {
    const validCategories: ColorCategory[] = [
      'red', 'orange', 'yellow', 'green', 'blue',
      'purple', 'pink', 'brown', 'black-gray', 'white',
      'transparent', 'special'
    ];

    return validCategories.includes(category as ColorCategory);
  }
}

// 全局单例
export const colorDataManager = new ColorDataManager();