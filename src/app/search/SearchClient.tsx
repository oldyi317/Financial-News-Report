"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface SearchItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  stocks: string[];
  date: string;
}

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search-index")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.stocks.some((s) => s.includes(q)) ||
          item.source.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [query, items]);

  const categoryColors: Record<string, string> = {
    "台股": "text-blue-400",
    "國際": "text-green-400",
    "產業": "text-yellow-400",
    "政策": "text-purple-400",
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="輸入關鍵字搜尋（標題、摘要、股票代號）"
        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
        autoFocus
      />

      {loading && <p className="text-gray-500 mt-4">載入搜尋索引中...</p>}

      {!loading && query.trim() && (
        <p className="text-gray-500 text-sm mt-3 mb-4">
          找到 {results.length} 筆結果{results.length === 50 ? "（僅顯示前 50 筆）" : ""}
        </p>
      )}

      <div className="space-y-3 mt-2">
        {results.map((item) => (
          <article
            key={`${item.date}-${item.id}`}
            className="bg-surface border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/daily/${item.date}`}
                className="text-xs text-gray-500 hover:text-primary transition-colors"
              >
                {item.date}
              </Link>
              <span className={`text-xs ${categoryColors[item.category] ?? "text-gray-400"}`}>
                {item.category}
              </span>
              <span className="text-xs text-gray-600">{item.source}</span>
            </div>
            <h3 className="font-bold text-white mb-1">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.summary}</p>
            {item.stocks.length > 0 && (
              <div className="flex gap-1 mt-2">
                {item.stocks.map((code) => (
                  <Link
                    key={code}
                    href={`/stock/${code}`}
                    className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded hover:bg-primary/30 transition-colors"
                  >
                    {code}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
