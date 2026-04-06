"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";
import ArticleList from "./ArticleList";

const CATEGORIES = ["全部", "台股", "國際", "產業", "政策"] as const;

export default function CategoryTabs({ articles }: { articles: Article[] }) {
  const [activeTab, setActiveTab] = useState<string>("全部");

  const filtered = activeTab === "全部"
    ? articles
    : articles.filter((a) => a.category === activeTab);

  return (
    <section className="mb-8">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === cat
                ? "bg-primary text-white"
                : "bg-surface text-gray-400 border border-border hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <ArticleList articles={filtered} />
    </section>
  );
}
