import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://financial-news-report.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "每日財經新聞",
    template: "%s — 每日財經新聞",
  },
  description: "AI 驅動的每日台股財經新聞自動整理，每日更新台股、國際、產業、政策新聞摘要。",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "每日財經新聞",
    description: "AI 驅動的每日台股財經新聞自動整理",
    type: "website",
    locale: "zh_TW",
    siteName: "每日財經新聞",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "每日財經新聞",
    description: "AI 驅動的每日台股財經新聞自動整理",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body
        className={`${notoSansTC.variable} font-sans bg-background text-white min-h-screen`}
      >
        <nav className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-primary">
              📊 每日財經新聞
            </Link>
            <div className="flex gap-4 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">首頁</Link>
              <Link href="/search" className="hover:text-white transition-colors">搜尋</Link>
              <Link href="/archive" className="hover:text-white transition-colors">歷史</Link>
              <a href="/feed.xml" className="hover:text-white transition-colors" title="RSS 訂閱">RSS</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
