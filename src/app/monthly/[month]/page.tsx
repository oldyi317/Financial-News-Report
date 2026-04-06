import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAvailableMonths,
  getMonthDates,
  getDailySummary,
  getDailyArticles,
  getMarketData,
} from "@/lib/data";

export function generateStaticParams() {
  return getAvailableMonths().map((m) => ({ month: m }));
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  return {
    title: `${month} 月報`,
    description: `${month} 月份財經新聞彙整`,
    openGraph: {
      title: `${month} 月報 — 每日財經新聞`,
      description: `${month} 月份財經新聞彙整`,
    },
  };
}

export default async function MonthlyPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const dates = getMonthDates(month);

  if (dates.length === 0) {
    notFound();
  }

  let totalArticles = 0;
  const categoryCounts: Record<string, number> = {};
  const marketData: { date: string; close: number; change: number }[] = [];

  for (const date of dates) {
    const articles = getDailyArticles(date);
    const market = getMarketData(date);
    const count = articles?.articles.length ?? 0;
    totalArticles += count;

    if (articles) {
      for (const a of articles.articles) {
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      }
    }

    if (market) {
      marketData.push({
        date,
        close: market.taiex.close,
        change: market.taiex.change,
      });
    }
  }

  const firstClose = marketData.length > 0 ? marketData[marketData.length - 1].close : null;
  const lastClose = marketData.length > 0 ? marketData[0].close : null;
  const monthChange = firstClose && lastClose ? lastClose - firstClose : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{month} 月報</h1>
      <p className="text-text-muted mb-6">
        共 {dates.length} 個交易日，{totalArticles} 篇新聞
      </p>

      {/* Month stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {lastClose && (
          <div className="bg-surface border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{lastClose.toLocaleString()}</div>
            <div className="text-text-muted text-sm">月底收盤</div>
          </div>
        )}
        {monthChange != null && (
          <div className="bg-surface border border-border rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${monthChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {monthChange >= 0 ? "+" : ""}{monthChange.toFixed(0)}
            </div>
            <div className="text-text-muted text-sm">月漲跌</div>
          </div>
        )}
        <div className="bg-surface border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-bold">{dates.length}</div>
          <div className="text-text-muted text-sm">交易日</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-bold">{totalArticles}</div>
          <div className="text-text-muted text-sm">總新聞數</div>
        </div>
      </div>

      {/* Category breakdown */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">分類統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <div key={cat} className="bg-surface border border-border rounded-lg p-3 text-center">
                <div className="text-lg font-bold">{count}</div>
                <div className="text-text-muted text-sm">{cat}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Daily list */}
      <section>
        <h2 className="text-xl font-bold mb-4">每日一覽</h2>
        <div className="space-y-2">
          {dates.map((date) => {
            const summary = getDailySummary(date);
            const m = marketData.find((d) => d.date === date);
            return (
              <Link
                key={date}
                href={`/daily/${date}`}
                className="flex items-center justify-between bg-surface border border-border rounded-lg p-3 hover:border-primary/50 transition-colors"
              >
                <span className="font-medium text-primary">{date}</span>
                <div className="flex items-center gap-3 text-sm">
                  {m && (
                    <span className={m.change >= 0 ? "text-green-400" : "text-red-400"}>
                      {m.close.toLocaleString()} {m.change >= 0 ? "▲" : "▼"}{Math.abs(m.change).toFixed(0)}
                    </span>
                  )}
                  {summary && <span className="text-text-muted hidden md:inline max-w-xs truncate">{summary.overview?.slice(0, 50)}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
