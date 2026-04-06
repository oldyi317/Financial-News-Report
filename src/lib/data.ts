import { supabase } from "./supabase";
import type { Article, ArticlesData, DailySummary, MarketData } from "./types";

// ============================================================
// Cache layer — fetch once per build, reuse across pages
// ============================================================

let cachedArticles: Map<string, Article[]> | null = null;
let cachedSummaries: Map<string, DailySummary> | null = null;
let cachedMarket: Map<string, MarketData> | null = null;

async function fetchPaginated<T>(table: string, orderBy: string, ascending = false): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const all: T[] = [];
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

async function fetchAllArticles(): Promise<Map<string, Article[]>> {
  if (cachedArticles) return cachedArticles;

  const rows = await fetchPaginated<Record<string, unknown>>("articles", "published_at");

  const map = new Map<string, Article[]>();
  for (const row of rows) {
    const article: Article = {
      id: row.id as string,
      title: row.title as string,
      source: row.source as string,
      sourceUrl: row.source_url as string,
      category: (row.category || "台股") as Article["category"],
      stocks: (row.stocks as string[]) || [],
      summary: (row.summary as string) || "",
      publishedAt: row.published_at as string,
    };
    const date = row.date as string;
    const existing = map.get(date) ?? [];
    existing.push(article);
    map.set(date, existing);
  }
  cachedArticles = map;
  return cachedArticles;
}

async function fetchAllSummaries(): Promise<Map<string, DailySummary>> {
  if (cachedSummaries) return cachedSummaries;

  const rows = await fetchPaginated<Record<string, unknown>>("daily_summaries", "date");

  const map = new Map<string, DailySummary>();
  for (const row of rows) {
    map.set(row.date as string, {
      date: row.date as string,
      overview: row.overview as string,
      highlights: (row.highlights as string[]) || [],
      categorySummaries: (row.category_summaries as Record<string, string>) ?? {},
    });
  }
  cachedSummaries = map;
  return cachedSummaries;
}

async function fetchAllMarket(): Promise<Map<string, MarketData>> {
  if (cachedMarket) return cachedMarket;

  const rows = await fetchPaginated<Record<string, unknown>>("market_data", "date");

  const map = new Map<string, MarketData>();
  for (const row of rows) {
    const topMovers = typeof row.top_movers === "string"
      ? JSON.parse(row.top_movers)
      : row.top_movers ?? [];
    map.set(row.date as string, {
      date: row.date as string,
      taiex: {
        close: Number(row.taiex_close),
        change: Number(row.taiex_change),
        changePercent: Number(row.taiex_change_percent),
        volume: Number(row.taiex_volume),
      },
      topMovers,
    });
  }
  cachedMarket = map;
  return cachedMarket;
}

// ============================================================
// Public API — async versions for Next.js server components
// ============================================================

export async function getAvailableDates(): Promise<string[]> {
  const map = await fetchAllArticles();
  return Array.from(map.keys()).sort().reverse();
}

export async function getLatestDate(): Promise<string | null> {
  const dates = await getAvailableDates();
  return dates.length > 0 ? dates[0] : null;
}

export async function getDailyArticles(date: string): Promise<ArticlesData | null> {
  const map = await fetchAllArticles();
  const articles = map.get(date);
  if (!articles || articles.length === 0) return null;
  return { date, articles };
}

export async function getDailySummary(date: string): Promise<DailySummary | null> {
  const map = await fetchAllSummaries();
  return map.get(date) ?? null;
}

export async function getMarketData(date: string): Promise<MarketData | null> {
  const map = await fetchAllMarket();
  return map.get(date) ?? null;
}

export async function getArticlesByCategory(date: string, category: string): Promise<Article[]> {
  const data = await getDailyArticles(date);
  if (!data) return [];
  return data.articles.filter((a) => a.category === category);
}

export async function getArticlesByStock(code: string): Promise<{ date: string; articles: Article[] }[]> {
  const allArticles = await fetchAllArticles();
  const results: { date: string; articles: Article[] }[] = [];

  for (const [date, articles] of allArticles) {
    const matched = articles.filter((a) => a.stocks.includes(code));
    if (matched.length > 0) {
      results.push({ date, articles: matched });
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAllStockCodes(): Promise<string[]> {
  const allArticles = await fetchAllArticles();
  const codes = new Set<string>();

  for (const articles of allArticles.values()) {
    for (const article of articles) {
      for (const code of article.stocks) {
        codes.add(code);
      }
    }
  }

  return Array.from(codes).sort();
}

export async function getAllArticles(): Promise<{ date: string; article: Article }[]> {
  const allArticles = await fetchAllArticles();
  const results: { date: string; article: Article }[] = [];

  for (const [date, articles] of allArticles) {
    for (const article of articles) {
      results.push({ date, article });
    }
  }

  return results;
}

export async function getHistoricalMarketData(): Promise<MarketData[]> {
  const map = await fetchAllMarket();
  return Array.from(map.values());
}

export async function getStockNameMap(): Promise<Record<string, string>> {
  const map = await fetchAllMarket();
  const names: Record<string, string> = {};

  for (const market of map.values()) {
    for (const mover of market.topMovers) {
      if (mover.code && mover.name) {
        names[mover.code] = mover.name;
      }
    }
  }

  return names;
}

// ============================================================
// Week / Month helpers
// ============================================================

export async function getWeekDates(dateStr: string): Promise<string[]> {
  const d = new Date(dateStr + "T00:00:00+08:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));

  const available = new Set(await getAvailableDates());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const str = cur.toISOString().slice(0, 10);
    if (available.has(str)) dates.push(str);
  }
  return dates;
}

export async function getMonthDates(yearMonth: string): Promise<string[]> {
  const available = await getAvailableDates();
  return available.filter((d) => d.startsWith(yearMonth));
}

export async function getAvailableWeeks(): Promise<{ label: string; start: string; end: string }[]> {
  const dates = await getAvailableDates();
  if (dates.length === 0) return [];

  const weekMap = new Map<string, string[]>();
  for (const dateStr of dates) {
    const d = new Date(dateStr + "T00:00:00+08:00");
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(dateStr);
  }

  return Array.from(weekMap.entries())
    .map(([start, days]) => ({
      label: `${start} ~ ${days[days.length - 1]}`,
      start,
      end: days[days.length - 1],
    }))
    .sort((a, b) => b.start.localeCompare(a.start));
}

export async function getAvailableMonths(): Promise<string[]> {
  const dates = await getAvailableDates();
  const months = new Set<string>();
  for (const d of dates) {
    months.add(d.slice(0, 7));
  }
  return Array.from(months).sort().reverse();
}
