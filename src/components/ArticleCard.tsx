import type { Article } from "@/lib/types";
import StockBadge from "./StockBadge";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="bg-surface border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
        <h3 className="font-bold text-white hover:text-primary transition-colors mb-2">
          {article.title}
        </h3>
      </a>
      <p className="text-sm text-gray-400 mb-3">{article.summary}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{article.source}</span>
          <span className="text-xs text-gray-600">{formatTime(article.publishedAt)}</span>
        </div>
        {article.stocks.length > 0 && (
          <div className="flex gap-1">
            {article.stocks.map((code) => (
              <StockBadge key={code} code={code} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
