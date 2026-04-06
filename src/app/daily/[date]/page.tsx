import { notFound } from "next/navigation";
import { getAvailableDates, getDailySummary, getMarketData, getDailyArticles } from "@/lib/data";
import DailySummaryComponent from "@/components/DailySummary";
import MarketIndicators from "@/components/MarketIndicators";
import CategoryTabs from "@/components/CategoryTabs";

export function generateStaticParams() {
  return getAvailableDates().map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const summary = getDailySummary(date);
  const description = summary?.overview
    ? summary.overview.slice(0, 160)
    : `${date} 台股財經新聞摘要`;
  return {
    title: `${date} 財經新聞報告`,
    description,
    openGraph: {
      title: `${date} 財經新聞報告`,
      description,
      type: "article",
    },
  };
}

export default async function DailyReportPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const summary = getDailySummary(date);
  const market = getMarketData(date);
  const articlesData = getDailyArticles(date);

  if (!summary && !articlesData) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{date} 財經新聞報告</h1>
      {summary && <DailySummaryComponent summary={summary} />}
      {market && <MarketIndicators market={market} />}
      {articlesData && (
        <>
          <h2 className="text-xl font-bold mb-4">當日新聞</h2>
          <CategoryTabs articles={articlesData.articles} />
        </>
      )}
    </main>
  );
}
