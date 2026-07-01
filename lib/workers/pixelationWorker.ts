/**
 * 像素化Web Worker
 * 用于在后台线程处理大图像像素化，避免阻塞UI
 */

export interface PixelationWorkerMessage {
  type: 'pixelate';
  imageData: ImageData;
  imgWidth: number;
  imgHeight: number;
  N: number;
  M: number;
  palette: Array<{
    key: string;
    color: string;
    rgb: { l: number; a: number; b: number };
  }>;
  mode: 'dominant' | 'average';
  fallbackColorKey: string;
  startIndex: number;
  endIndex: number;
  workerIndex: number;
}

export interface PixelationWorkerResult {
  type: 'pixelate-result';
  workerIndex: number;
  result: Array<{ x: number; y: number; colorKey: string }>;
  error?: string;
}

/**
 * 颜色转换工具
 */
function rgbToOklab(rgb: { r: number; g: number; b: number }): { l: number; a: number; b: number } {
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

  return { l, a, b };
}

/**
 * 计算Delta E
 */
function calculateDeltaE(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number }
): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * 找到最接近的颜色
 */
function findClosestColor(
  targetRgb: { r: number; g: number; b: number; a: number },
  palette: Array<{
    key: string;
    color: string;
    rgb: { l: number; a: number; b: number };
  }>
): string | null {
  if (palette.length === 0) return null;

  let minDistance = Infinity;
  let closestKey = palette[0].key;

  const targetLab = rgbToOklab(targetRgb);

  for (const color of palette) {
    const distance = calculateDeltaE(targetLab, color.rgb);

    if (distance < minDistance) {
      minDistance = distance;
      closestKey = color.key;
    }

    if (distance === 0) break;
  }

  return closestKey;
}

/**
 * 计算单元格代表色
 */
function calculateCellRepresentativeColor(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number,
  mode: 'dominant' | 'average'
): { r: number; g: number; b: number; a: number } | null {
  const data = imageData.data;
  const imgWidth = imageData.width;
  let pixelCount = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  const colorCounts: { [key: string]: number } = {};

  const endY = Math.min(startY + height, imageData.height);
  const endX = Math.min(startX + width, imageData.width);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * imgWidth + x) * 4;

      if (data[index + 3] < 128) continue;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      if (mode === 'average') {
        sumR += r;
        sumG += g;
        sumB += b;
        pixelCount++;
      } else {
        const colorKey = `${r},${g},${b}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        pixelCount++;
      }
    }
  }

  if (pixelCount === 0) return null;

  if (mode === 'average') {
    return {
      r: Math.round(sumR / pixelCount),
      g: Math.round(sumG / pixelCount),
      b: Math.round(sumB / pixelCount),
      a: 1
    };
  } else {
    let maxCount = 0;
    let bestR = 0, bestG = 0, bestB = 0;

    for (const [key, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = key.split(',').map(Number);
        bestR = r;
        bestG = g;
        bestB = b;
      }
    }

    return { r: bestR, g: bestG, b: bestB, a: 1 };
  }
}

/**
 * 处理像素化任务
 */
function handlePixelationTask(
  message: PixelationWorkerMessage
): PixelationWorkerResult {
  const {
    imageData,
    imgWidth,
    imgHeight,
    N,
    M,
    palette,
    mode,
    fallbackColorKey,
    startIndex,
    endIndex,
    workerIndex
  } = message;

  try {

    const result: Array<{ x: number; y: number; colorKey: string }> = [];
    const cellWidthOriginal = imgWidth / N;
    const cellHeightOriginal = imgHeight / M;

    for (let j = startIndex; j < endIndex; j++) {
      for (let i = 0; i < N; i++) {
        const startXOriginal = Math.floor(i * cellWidthOriginal);
        const startYOriginal = Math.floor(j * cellHeightOriginal);
        const currentCellWidth = Math.max(1, Math.ceil(cellWidthOriginal));
        const currentCellHeight = Math.max(1, Math.ceil(cellHeightOriginal));

        const representativeColor = calculateCellRepresentativeColor(
          imageData,
          startXOriginal,
          startYOriginal,
          currentCellWidth,
          currentCellHeight,
          mode
        );

        let colorKey: string;
        if (representativeColor) {
          const closestKey = findClosestColor(representativeColor, palette);
          colorKey = closestKey || fallbackColorKey;
        } else {
          colorKey = 'TRANSPARENT';
        }

        result.push({ x: i, y: j, colorKey });
      }
    }

    return {
      type: 'pixelate-result',
      workerIndex,
      result
    };
  } catch (error) {
    return {
      type: 'pixelate-result',
      workerIndex,
      result: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Worker消息处理
self.onmessage = (e: MessageEvent<PixelationWorkerMessage>) => {
  const result = handlePixelationTask(e.data);
  self.postMessage(result);
};