import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./components/ui/ui-components.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "拼豆图纸生成器 | Perler Bead Generator",
  description: "将图片转换为拼豆图纸，支持Perler、Hama、Artkal品牌色号匹配，卡通可爱风格",
  manifest: "/manifest.json",
  applicationName: "拼豆图纸生成器",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "拼豆图纸生成器"
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#FF6B9D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker 注册成功:', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker 注册失败:', err);
                  }
                );
              });
            }`
          }}
        />
      </body>
    </html>
  );
}
