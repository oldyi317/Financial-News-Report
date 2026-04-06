import Link from "next/link";
import {
  getLatestDate,
  getDailySummary,
  getMarketData,
  getDailyArticles,
  getHistoricalMarketData,
  getStockNameMap,
} from "@/lib/data";
import DailySummaryComponent from "@/components/DailySummary";
import MarketIndicators from "@/components/MarketIndicators";
import CategoryTabs from "@/components/CategoryTabs";
import StockBadge from "@/components/StockBadge";
import TaiexChart from "@/components/TaiexChart";
import type { Article } from "@/lib/types";

export const revalidate = 3600; // ISR: revalidate every hour

function getHotStocks(articles: Article[]): { code: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const article of articles) {
    for (const code of article.stocks) {
      counts[code] = (counts[code] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default async function Home() {
  const date = await getLatestDate();

  if (!date) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">📊 每日財經新聞</h1>
        <p className="text-text-secondary mt-4">尚無新聞資料</p>
      </main>
    );
  }

  const [summary, market, articlesData, historicalMarket, stockNames] = await Promise.all([
    getDailySummary(date),
    getMarketData(date),
    getDailyArticles(date),
    getHistoricalMarketData(),
    getStockNameMap(),
  ]);

  const articles = articlesData?.articles ?? [];
  const hotStocks = getHotStocks(articles);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">📊 每日財經新聞</h1>
        <p className="text-text-muted mt-2">
          <Link href={`/daily/${date}`} className="hover:text-primary transition-colors">
            {date} →
          </Link>
        </p>
      </header>

      {summary && <DailySummaryComponent summary={summary} />}
      {market && <MarketIndicators market={market} />}
      {historicalMarket.length >= 2 && <TaiexChart data={historicalMarket} />}

      <h2 className="text-xl font-bold mb-4">分類新聞</h2>
      <CategoryTabs articles={articles} />

      {hotStocks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">熱門個股</h2>
          <div className="flex gap-3 flex-wrap">
            {hotStocks.map(({ code, count }) => (
              <div key={code} className="bg-surface border border-border rounded-lg px-4 py-2 flex items-center gap-2">
                <StockBadge code={code} />
                {stockNames[code] && <span className="text-xs text-text-secondary">{stockNames[code]}</span>}
                <span className="text-xs text-text-muted">{count} 則新聞</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center text-xs text-text-muted py-8 border-t border-border mt-8">
        <p>資料來源：鉅亨網、經濟日報、Yahoo 奇摩股市、MoneyDJ、工商時報、自由財經</p>
        <p className="mt-1">最後更新：{date}</p>
      </footer>
    </main>
  );
}
