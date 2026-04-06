import { notFound } from "next/navigation";
import { getAllStockCodes, getArticlesByStock } from "@/lib/data";
import ArticleCard from "@/components/ArticleCard";

export function generateStaticParams() {
  const codes = getAllStockCodes();
  return codes.map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const description = `股票代號 ${code} 的相關財經新聞整理`;
  return {
    title: `${code} 相關新聞`,
    description,
    openGraph: {
      title: `${code} 相關新聞 — 每日財經新聞`,
      description,
    },
  };
}

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const results = getArticlesByStock(code);

  if (results.length === 0) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{code} 相關新聞</h1>

      {results.map(({ date, articles }) => (
        <section key={date} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">{date}</h2>
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
