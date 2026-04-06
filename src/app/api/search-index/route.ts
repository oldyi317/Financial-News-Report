import { getAllArticles } from "@/lib/data";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const allArticles = await getAllArticles();

  const index = allArticles.map(({ date, article }) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    category: article.category,
    source: article.source,
    stocks: article.stocks,
    date,
  }));

  return Response.json(index, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
