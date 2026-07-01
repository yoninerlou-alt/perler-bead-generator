/**
 * 可爱图片上传组件
 */

import { useState, useCallback } from 'react';
import type { BeadColor } from '@/types/color';
import { createImageDataFromFile } from '@/lib/utils/pixelationUtils';
import { matchColorsToPalette, pixelateImage } from '@/lib/utils/pixelationUtils';
import type { MappedPixel } from '@/types/color';
import { ExampleGallery } from './ExampleGallery';

interface ImageUploaderProps {
  onGridGenerated: (grid: MappedPixel[][]) => void;
  selectedPalette: BeadColor[];
  pixelSize: number;
}

export function ImageUploader({
  onGridGenerated,
  selectedPalette,
  pixelSize
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // 验证文件类型
      if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
        setError('请上传 JPG、PNG 或 GIF 格式的图片');
        return;
      }

      // 验证文件大小（最大10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过10MB');
        return;
      }

      setIsUploading(true);

      try {
        // 创建ImageData
        const imageData = await createImageDataFromFile(file);

        // 像素化
        const grid = pixelateImage(imageData, pixelSize, 'dominant');

        // 匹配颜色
        const matchedGrid = matchColorsToPalette(grid, selectedPalette, true);

        onGridGenerated(matchedGrid);
      } catch (err) {
        setError(err instanceof Error ? err.message : '图片处理失败');
        console.error('图片处理错误:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [onGridGenerated, selectedPalette, pixelSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 从URL加载图片（用于示例图片）
  const handleUrlLoad = useCallback(
    async (url: string) => {
      setError(null);
      setIsUploading(true);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('无法加载示例图片');
        }
        const blob = await response.blob();
        const file = new File([blob], 'example.svg', { type: blob.type || 'image/svg+xml' });

        // SVG需要先转换为栅格数据
        const imageData = await createImageDataFromFile(file);
        const grid = pixelateImage(imageData, pixelSize, 'dominant');
        const matchedGrid = matchColorsToPalette(grid, selectedPalette, true);
        onGridGenerated(matchedGrid);
      } catch (err) {
        setError(err instanceof Error ? err.message : '示例图片加载失败');
        console.error('示例图片加载错误:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [onGridGenerated, selectedPalette, pixelSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div
      className={`image-uploader ${dragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        className="file-input"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="upload-area">
        {isUploading ? (
          <>
            <span className="loading-spinner">🌀</span>
            <span className="upload-text">处理中...</span>
          </>
        ) : (
          <>
            <span className="upload-icon">📸</span>
            <span className="upload-text">
              拖拽图片到这里，或点击上传
            </span>
            <span className="upload-hint">支持 JPG、PNG、GIF 格式</span>
          </>
        )}
      </label>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* 示例图片画廊 */}
      {!isUploading && (
        <ExampleGallery onSelect={handleUrlLoad} />
      )}
    </div>
  );
}