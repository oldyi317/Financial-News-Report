import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "搜尋新聞",
  description: "搜尋歷史財經新聞文章",
  openGraph: {
    title: "搜尋新聞 — 每日財經新聞",
    description: "搜尋歷史財經新聞文章",
  },
};

export default function SearchPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">搜尋新聞</h1>
      <SearchClient />
    </main>
  );
}
