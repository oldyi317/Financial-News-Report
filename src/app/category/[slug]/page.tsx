import { notFound } from "next/navigation";
import { getLatestDate, getDailyArticles } from "@/lib/data";
import ArticleList from "@/components/ArticleList";

const slugToCategory: Record<string, string> = {
  "taiwan-stock": "台股",
  international: "國際",
  industry: "產業",
  policy: "政策",
};

const allSlugs = Object.keys(slugToCategory);

export function generateStaticParams() {
  return allSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = slugToCategory[slug];
  if (!category) return { title: "分類不存在" };
  return {
    title: `${category} — 每日財經新聞`,
    description: `${category}類財經新聞`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = slugToCategory[slug];

  if (!category) {
    notFound();
  }

  const date = getLatestDate();

  if (!date) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">{category}</h1>
        <p className="text-gray-400 mt-4">尚無新聞資料</p>
      </main>
    );
  }

  const articlesData = getDailyArticles(date);
  const articles = (articlesData?.articles ?? []).filter(
    (a) => a.category === category
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{category}</h1>
      <p className="text-gray-500 mb-6">{date}</p>
      <ArticleList articles={articles} />
    </main>
  );
}
