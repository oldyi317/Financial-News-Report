import { notFound } from "next/navigation";
import { getAllStockCodes, getArticlesByStock, getStockNameMap } from "@/lib/data";
import ArticleCard from "@/components/ArticleCard";

export async function generateStaticParams() {
  const codes = await getAllStockCodes();
  return codes.map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const stockNames = await getStockNameMap();
  const name = stockNames[code];
  const label = name ? `${code} ${name}` : code;
  const description = `${label} 的相關財經新聞整理`;
  return {
    title: `${label} 相關新聞`,
    description,
    openGraph: {
      title: `${label} 相關新聞 — 每日財經新聞`,
      description,
    },
  };
}

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const [results, stockNames] = await Promise.all([
    getArticlesByStock(code),
    getStockNameMap(),
  ]);

  if (results.length === 0) {
    notFound();
  }

  const name = stockNames[code];
  const label = name ? `${code} ${name}` : code;
  const totalArticles = results.reduce((sum, r) => sum + r.articles.length, 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{label} 相關新聞</h1>
        <p className="text-text-muted mt-1">
          共 {totalArticles} 篇新聞，橫跨 {results.length} 天
        </p>
      </div>

      {results.map(({ date, articles }) => (
        <section key={date} className="mb-8">
          <h2 className="text-lg font-semibold text-text-secondary mb-4">
            {date}
            <span className="text-text-muted text-sm font-normal ml-2">({articles.length} 篇)</span>
          </h2>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
