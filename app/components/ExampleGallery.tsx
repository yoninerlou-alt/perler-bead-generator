/**
 * 示例图片画廊组件
 * 提供预设图片供用户快速体验
 */

'use client';

import { useState, useEffect } from 'react';

interface ExampleImage {
  id: string;
  name: string;
  emoji: string;
  path: string;
  description: string;
  difficulty: string;
  recommendedColors: string[];
}

interface ExampleGalleryProps {
  onSelect: (imagePath: string) => void;
}

export function ExampleGallery({ onSelect }: ExampleGalleryProps) {
  const [examples, setExamples] = useState<ExampleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/examples/index.json')
      .then((res) => res.json())
      .then((data) => {
        setExamples(data.examples);
        setLoading(false);
      })
      .catch((err) => {
        console.error('加载示例图片失败:', err);
        setLoading(false);
      });
  }, []);

  const handleSelect = (example: ExampleImage) => {
    setSelectedId(example.id);
    onSelect(example.path);
  };

  if (loading) {
    return (
      <div className="example-gallery-loading">
        <span className="loading-emoji">⏳</span>
        <span>加载示例中...</span>
      </div>
    );
  }

  return (
    <div className="example-gallery">
      <div className="gallery-header">
        <span className="gallery-icon">🎨</span>
        <span className="gallery-title">试试示例图片</span>
      </div>
      <div className="gallery-grid">
        {examples.map((example) => (
          <button
            key={example.id}
            className={`example-card ${selectedId === example.id ? 'selected' : ''}`}
            onClick={() => handleSelect(example)}
            type="button"
            title={example.description}
          >
            <div className="example-emoji">{example.emoji}</div>
            <div className="example-name">{example.name}</div>
            <div className={`example-difficulty ${example.difficulty}`}>
              {example.difficulty}
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .example-gallery {
          margin-top: var(--space-lg);
          padding-top: var(--space-lg);
          border-top: 2px solid var(--color-border-light);
        }

        .gallery-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
          font-family: var(--font-heading);
          font-size: 14px;
          color: var(--color-text);
        }

        .gallery-icon {
          font-size: 18px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: var(--space-sm);
        }

        .example-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: var(--space-sm) var(--space-xs);
          background: var(--color-background);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--duration-fast) var(--easing-bounce);
          font-family: var(--font-body);
        }

        .example-card:hover {
          background: var(--color-surface-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .example-card.selected {
          background: var(--color-surface);
          border-color: var(--color-primary);
          box-shadow: var(--shadow);
        }

        .example-emoji {
          font-size: 32px;
          line-height: 1;
        }

        .example-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          text-align: center;
        }

        .example-difficulty {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }

        .example-difficulty.简单 {
          background: var(--color-success);
          color: white;
        }

        .example-difficulty.中等 {
          background: var(--color-warning);
          color: var(--color-text);
        }

        .example-difficulty.困难 {
          background: var(--color-error);
          color: white;
        }

        .example-gallery-loading {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          color: var(--color-text-light);
          font-size: 14px;
        }

        .loading-emoji {
          font-size: 18px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
