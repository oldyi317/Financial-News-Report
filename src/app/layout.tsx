import type { Metadata } from "next";
import { Noto_Sans_TC, IBM_Plex_Sans } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    <html lang="zh-TW" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme');
            var d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', d);
          })();
        `}} />
      </head>
      <body
        className={`${notoSansTC.variable} ${ibmPlexSans.variable} font-sans antialiased bg-background text-text-primary min-h-screen`}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
}
