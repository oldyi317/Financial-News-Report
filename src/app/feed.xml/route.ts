import { getAvailableDates, getDailyArticles, getDailySummary } from "@/lib/data";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://financial-news-report.vercel.app";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const dates = getAvailableDates().slice(0, 30);

  const items = dates
    .map((date) => {
      const summary = getDailySummary(date);
      const articlesData = getDailyArticles(date);
      const articleCount = articlesData?.articles.length ?? 0;
      const description = summary?.overview
        ? escapeXml(summary.overview)
        : `${date} 台股財經新聞摘要（${articleCount} 篇）`;

      return `    <item>
      <title>${escapeXml(`${date} 財經新聞報告`)}</title>
      <link>${SITE_URL}/daily/${date}</link>
      <guid isPermaLink="true">${SITE_URL}/daily/${date}</guid>
      <pubDate>${new Date(date + "T08:00:00+08:00").toUTCString()}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>每日財經新聞</title>
    <link>${SITE_URL}</link>
    <description>AI 驅動的每日台股財經新聞自動整理</description>
    <language>zh-TW</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
