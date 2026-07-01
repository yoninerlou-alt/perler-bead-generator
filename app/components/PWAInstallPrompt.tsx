/**
 * PWA安装提示组件
 * 在用户满足安装条件时显示安装按钮
 */

'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);

      // 24小时内不重复显示
      const lastShown = localStorage.getItem('pwa-install-prompt-shown');
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
        // 延迟显示，避免打扰用户
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // 监听已安装事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setInstallPromptEvent(null);
      console.log('PWA 已安装');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    if (choice.outcome === 'accepted') {
      console.log('用户接受安装');
    } else {
      console.log('用户拒绝安装');
    }

    setInstallPromptEvent(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', Date.now().toString());
  };

  if (!showPrompt || isInstalled || !installPromptEvent) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-prompt-decoration" />
      <div className="pwa-prompt-icon">📱</div>
      <div className="pwa-prompt-content">
        <h3 className="pwa-prompt-title">安装到桌面</h3>
        <p className="pwa-prompt-text">
          离线也能用，更流畅的拼豆创作体验~
        </p>
      </div>
      <div className="pwa-prompt-actions">
        <button
          className="pwa-btn-dismiss"
          onClick={handleDismiss}
          type="button"
        >
          稍后
        </button>
        <button
          className="pwa-btn-install"
          onClick={handleInstallClick}
          type="button"
        >
          安装 ✨
        </button>
      </div>

      <style jsx>{`
        .pwa-install-prompt {
          position: fixed;
          bottom: var(--space-xl);
          left: var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          box-shadow: var(--shadow-lg);
          border: 3px solid var(--color-primary);
          max-width: 420px;
          z-index: 9000;
          animation: slideInUp 0.4s var(--easing-bounce);
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pwa-prompt-decoration {
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-accent));
          border-radius: var(--radius-2xl);
          z-index: -1;
          opacity: 0.2;
        }

        .pwa-prompt-icon {
          font-size: 40px;
          flex-shrink: 0;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .pwa-prompt-content {
          flex: 1;
        }

        .pwa-prompt-title {
          font-family: var(--font-heading);
          font-size: 18px;
          color: var(--color-primary);
          margin: 0 0 4px;
        }

        .pwa-prompt-text {
          font-size: 13px;
          color: var(--color-text-light);
          margin: 0;
          line-height: 1.4;
        }

        .pwa-prompt-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .pwa-btn-dismiss,
        .pwa-btn-install {
          padding: var(--space-sm) var(--space-md);
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          white-space: nowrap;
        }

        .pwa-btn-dismiss {
          background: var(--color-background);
          color: var(--color-text-light);
        }

        .pwa-btn-dismiss:hover {
          background: var(--color-surface-hover);
        }

        .pwa-btn-install {
          background: var(--color-primary);
          color: white;
        }

        .pwa-btn-install:hover {
          background: #FF5887;
          transform: scale(1.05);
        }

        @media (max-width: 600px) {
          .pwa-install-prompt {
            left: var(--space-md);
            right: var(--space-md);
            bottom: var(--space-md);
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
