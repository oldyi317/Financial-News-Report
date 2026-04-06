import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";

export default function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return <p className="text-text-muted text-center py-8">暫無新聞</p>;
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
