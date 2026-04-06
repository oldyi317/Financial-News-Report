import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAvailableWeeks,
  getWeekDates,
  getDailySummary,
  getDailyArticles,
  getMarketData,
} from "@/lib/data";

export async function generateStaticParams() {
  const weeks = await getAvailableWeeks();
  return weeks.map((w) => ({ week: w.start }));
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  return {
    title: `${week} 週報`,
    description: `${week} 起的每週財經新聞彙整`,
    openGraph: {
      title: `${week} 週報 — 每日財經新聞`,
      description: `${week} 起的每週財經新聞彙整`,
    },
  };
}

export default async function WeeklyPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const dates = await getWeekDates(week);

  if (dates.length === 0) {
    notFound();
  }

  let totalArticles = 0;
  const categoryCounts: Record<string, number> = {};
  const dailyData: { date: string; overview: string; articleCount: number; marketClose?: number; marketChange?: number }[] = [];

  for (const date of dates) {
    const [summary, articles, market] = await Promise.all([
      getDailySummary(date),
      getDailyArticles(date),
      getMarketData(date),
    ]);
    const count = articles?.articles.length ?? 0;
    totalArticles += count;

    if (articles) {
      for (const a of articles.articles) {
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      }
    }

    dailyData.push({
      date,
      overview: summary?.overview ?? "",
      articleCount: count,
      marketClose: market?.taiex.close,
      marketChange: market?.taiex.change,
    });
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">週報：{dates[0]} ~ {dates[dates.length - 1]}</h1>
      <p className="text-text-muted mb-6">
        共 {dates.length} 個交易日，{totalArticles} 篇新聞
      </p>

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

      <section>
        <h2 className="text-xl font-bold mb-4">每日摘要</h2>
        <div className="space-y-4">
          {dailyData.map((d) => (
            <div key={d.date} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Link href={`/daily/${d.date}`} className="font-bold text-primary hover:underline">
                  {d.date}
                </Link>
                <div className="flex items-center gap-3 text-sm">
                  {d.marketClose != null && (
                    <span className="text-text-secondary">
                      {d.marketClose.toLocaleString()}
                      {d.marketChange != null && (
                        <span className={d.marketChange >= 0 ? " text-green-400" : " text-red-400"}>
                          {" "}{d.marketChange >= 0 ? "▲" : "▼"}{Math.abs(d.marketChange).toFixed(0)}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="text-text-muted">{d.articleCount} 篇</span>
                </div>
              </div>
              {d.overview && <p className="text-text-secondary text-sm">{d.overview}</p>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
