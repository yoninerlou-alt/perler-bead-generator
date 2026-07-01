# 国外品牌色号数据格式规范

本文档定义了所有国外拼豆品牌所需的色号数据格式。

## 数据结构概览

### 1. 品牌数据（必填）

每个品牌一个独立的JSON文件，命名格式：`brand-[brand-name].json`

```json
{
  "brandId": "perler",
  "brandName": "Perler",
  "displayName": "Perler Beads",
  "region": "north-america",
  "totalColors": 103,
  "beadSize": 5.0,
  "website": "https://www.perler.com",
  "shopUrl": "https://www.perler.com/shop",
  "officialDocs": "https://www.perler.com/color-chart",
  "logo": "/images/logos/perler.png",
  "colorData": [
    {
      "id": "perler-019",
      "code": "019",
      "name": "Red",
      "hex": "#FF0000",
      "rgb": [255, 0, 0],
      "lab": [53.24, 80.09, 67.20],
      "category": "red",
      "popularity": 95,
      "discontinued": false,
      "alternativeIds": ["hama-H22", "artkal-S14"],
      "purchaseUrl": "https://www.perler.com/shop/red-beads-1000ct/019-red-1000.html",
      "hexSource": "verified"
    }
  ]
}
```

### 2. 品牌间颜色映射（必填）

统一映射文件，包含所有颜色在所有品牌下的对应关系：

```json
{
  "mappings": [
    {
      "hex": "#FF0000",
      "perler": "019",
      "hama": "H22",
      "artkal": "S14",
      "nabbi": null,
      "pyssla": null,
      "melty-beads": null
    }
  ]
}
```

### 3. 色号分类数据（可选，推荐）

```json
{
  "categories": {
    "red": ["perler-019", "perler-057", "perler-072", ...],
    "orange": ["perler-021", "perler-017", ...],
    "yellow": ["perler-015", "perler-008", ...],
    "green": ["perler-017", "perler-004", ...],
    "blue": ["perler-026", "perler-003", ...],
    "purple": ["perler-093", "perler-053", ...],
    "brown": ["perler-069", "perler-028", ...],
    "black-gray": ["perler-021", "perler-022", ...],
    "white": ["perler-041", "perler-040", ...],
    "transparent": ["perler-TRANSPARENT", "hama-TRANSPARENT", ...],
    "special": ["perler-glitter", "hama-glitter", ...]
  }
}
```

---

## 字段说明

### 品牌数据字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| brandId | string | ✅ | 品牌唯一标识（小写，用连字符） |
| brandName | string | ✅ | 品牌英文名称 |
| displayName | string | ✅ | 品牌显示名称（本地化） |
| region | string | ✅ | 市场地区：north-america, europe, global |
| totalColors | number | ✅ | 总颜色数量 |
| beadSize | number | ✅ | 拼豆标准尺寸（mm） |
| website | string | ✅ | 品牌官网URL |
| shopUrl | string | ✅ | 购买页面URL |
| officialDocs | string | ✅ | 官方色号文档URL |
| logo | string | ✅ | Logo文件路径 |
| colorData | array | ✅ | 颜色数据数组 |

### 颜色数据字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 唯一标识符（brandId-code） |
| code | string | ✅ | 品牌官方色号 |
| name | string | ✅ | 颜色名称 |
| hex | string | ✅ | 十六进制颜色代码（必须7字符，如 #FF0000） |
| rgb | number[] | ✅ | RGB值 [r, g, b] (0-255) |
| lab | number[] | ✅ | CIELAB值 [L, a, b] |
| category | string | ✅ | 颜色分类 |
| popularity | number | ✅ | 流行度评分 (0-100) |
| discontinued | boolean | ✅ | 是否停产 |
| alternativeIds | string[] | ✅ | 其他品牌对应色号 |
| purchaseUrl | string | ✅ | 购买页面URL |
| hexSource | string | ✅ | 数据来源：verified（官方验证）或 estimated（估算） |

---

## 颜色分类标准

### 标准分类
```typescript
type ColorCategory =
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
  | 'special'   // 特殊效果（发光、透明等）
```

### 分类判断规则

**红色系：** RGB中红色分量最大，且亮度 < 40
**橙色系：** RGB中红色和绿色分量最大，且蓝色分量 < 40
**黄色系：** RGB中红色和绿色分量最大，且蓝色分量 < 40
**绿色系：** RGB中绿色分量最大
**蓝色系：** RGB中蓝色分量最大
**紫色系：** RGB中红色和蓝色分量最大，且绿色分量最小
**棕色系：** 所有分量都较低，且接近
**黑色/灰色：** RGB三个分量都接近
**白色：** RGB三个分量都接近255
**透明：** 透明度 < 10%

---

## 完整数据示例

### Perler品牌数据示例

```json
{
  "brandId": "perler",
  "brandName": "Perler",
  "displayName": "Perler Beads",
  "region": "north-america",
  "totalColors": 103,
  "beadSize": 5.0,
  "website": "https://www.perler.com",
  "shopUrl": "https://www.perler.com/shop",
  "officialDocs": "https://www.perler.com/color-chart",
  "logo": "/images/logos/perler.png",
  "colorData": [
    {
      "id": "perler-019",
      "code": "019",
      "name": "Red",
      "hex": "#FF0000",
      "rgb": [255, 0, 0],
      "lab": [53.24, 80.09, 67.20],
      "category": "red",
      "popularity": 95,
      "discontinued": false,
      "alternativeIds": ["hama-H22", "artkal-S14"],
      "purchaseUrl": "https://www.perler.com/shop/red-beads-1000ct/019-red-1000.html",
      "hexSource": "verified"
    },
    {
      "id": "perler-021",
      "code": "021",
      "name": "Orange",
      "hex": "#FFA500",
      "rgb": [255, 165, 0],
      "lab": [67.06, 37.75, 73.06],
      "category": "orange",
      "popularity": 90,
      "discontinued": false,
      "alternativeIds": ["hama-H17", "artkal-S15"],
      "purchaseUrl": "https://www.perler.com/shop/orange-beads-1000ct/021-orange-1000.html",
      "hexSource": "verified"
    }
    // ... 其他101种颜色
  ]
}
```

### 品牌映射示例

```json
{
  "mappings": [
    {
      "hex": "#FF0000",
      "perler": "019",
      "hama": "H22",
      "artkal": "S14",
      "nabbi": null,
      "pyssla": null,
      "melty-beads": null
    },
    {
      "hex": "#FFA500",
      "perler": "021",
      "hama": "H17",
      "artkal": "S15",
      "nabbi": null,
      "pyssla": null,
      "melty-beads": null
    }
    // ... 其他映射
  ]
}
```

---

## 数据收集指南

### 推荐数据来源

**Perler（103色）：**
- 官方网站：https://www.perler.com/color-chart
- 购买页面：https://www.perler.com/shop
- 色号卡参考：官方色号卡片照片

**Hama（92色）：**
- 官方网站：https://www.hama.com
- 官方PDF色卡表

**Artkal（199色）：**
- 官方网站：https://www.artkalbeads.com
- 色号表：https://www.artkalbeads.com/colors

**Nabbi（30色）：**
- 官方网站：https://www.nabbi.com/products/nabbi-biobeads/
- BioBeads系列色号表

**Pyssla（约60色）：**
- 官方网站：https://ikea.co.uk/products/pyssla/398648/
- 宜家产品色号表

**Melty Beads（约80色）：**
- 官方网站：https://www.meltybeads.com/
- 色号参考表

### 数据收集步骤

1. **提取HEX值**：从色号卡片或网站获取
2. **测量RGB值**：从HEX转换到RGB
3. **计算CIELAB值**：使用在线工具或公式
4. **验证色号**：对比官方色号表
5. **获取购买链接**：每个颜色的官方购买页面URL

### 数据质量要求

- ✅ **必须**：HEX值（7字符，如 #FF0000）
- ✅ **必须**：RGB值（0-255）
- ✅ **必须**：官方色号名称
- ✅ **推荐**：CIELAB值（更准确的匹配）
- ✅ **推荐**：分类（red/orange/yellow等）
- ✅ **推荐**：流行度评分（0-100）
- ✅ **推荐**：是否停产

---

## 错误处理

### 缺失字段的容错

- `lab` 缺失：临时按RGB估算
- `category` 缺失：默认为"special"
- `popularity` 缺失：默认为50

### 格式验证

```typescript
// 验证颜色数据的正则表达式
const hexPattern = /^#[0-9A-Fa-f]{6}$/;
const rgbPattern = /^(\d{1,3}),(\d{1,3}),(\d{1,3})\)$/;
const labPattern = /^([\d-9\.]+),([\d-9\.]+),([\d-9\.]+)\)$/;
```

---

## 文件命名规范

- 品牌文件：`brand-[brand-name].json`
  - 例如：`brand-perler.json`, `brand-hama.json`, `brand-artkal.json`
- 映射文件：`color-mappings.json`
- 分类文件：`color-categories.json`
- 示例文件：`example-brand-perler.json`
- README文件：`BRAND_DATA_FORMAT.md`

---

## 导出格式要求

当用户选择导出采购清单时，生成以下格式：

### PNG统计图格式
- 每种颜色一行：色块 + 色号 + 数量
- 包含总计
- 品牌水印

### JSON数据格式
```json
{
  "brand": "perler",
  "exportDate": "2025-06-30",
  "items": [
    {
      "colorCode": "019",
      "colorName": "Red",
      "colorHex": "#FF0000",
      "quantity": 245,
      "packages": 3,
      "category": "red",
      "purchaseUrl": "https://www.perler.com/shop/red-beads-1000ct/019-red-1000.html"
    }
  ],
  "summary": {
    "totalBeads": 4582,
    "uniqueColors": 12,
    "estimatedPackages": 46
  }
}
```

---

## 版本控制

- 数据格式版本：v1.0
- 最后更新：2025-06-30
- 维护者：开发团队

---

## 相关资源

- 色彩空间转换工具：https://colormine.app/convert
- CIELAB计算工具：https://colormine.app/convert
- 品牌官方文档链接集合

---

*本文档需要配合实际的色号数据文件使用。*