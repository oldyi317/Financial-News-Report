import fs from "fs";
import path from "path";
import type { Article, ArticlesData, DailySummary, MarketData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Scan data/ directory and return sorted dates (newest first).
 * Expects structure: data/YYYY/MM/DD/
 */
export function getAvailableDates(): string[] {
  const dates: string[] = [];

  if (!fs.existsSync(DATA_DIR)) return dates;

  const years = fs.readdirSync(DATA_DIR).filter((f) => {
    const full = path.join(DATA_DIR, f);
    return fs.statSync(full).isDirectory() && /^\d{4}$/.test(f);
  });

  for (const year of years) {
    const yearDir = path.join(DATA_DIR, year);
    const months = fs.readdirSync(yearDir).filter((f) => {
      const full = path.join(yearDir, f);
      return fs.statSync(full).isDirectory() && /^\d{2}$/.test(f);
    });

    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const days = fs.readdirSync(monthDir).filter((f) => {
        const full = path.join(monthDir, f);
        return fs.statSync(full).isDirectory() && /^\d{2}$/.test(f);
      });

      for (const day of days) {
        dates.push(`${year}-${month}-${day}`);
      }
    }
  }

  return dates.sort().reverse();
}

/**
 * Return the most recent date, or null if no data exists.
 */
export function getLatestDate(): string | null {
  const dates = getAvailableDates();
  return dates.length > 0 ? dates[0] : null;
}

function dateToPath(date: string): string {
  const [year, month, day] = date.split("-");
  return path.join(DATA_DIR, year, month, day);
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Read articles.json for a given date.
 * Handles both { date, articles: [...] } and raw [...] formats.
 */
export function getDailyArticles(date: string): ArticlesData | null {
  const filePath = path.join(dateToPath(date), "articles.json");
  const raw = readJsonFile<ArticlesData | Article[]>(filePath);
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return { date, articles: raw };
  }
  if (!raw.articles || !Array.isArray(raw.articles)) return null;
  return raw;
}

/**
 * Read summary.json for a given date.
 */
export function getDailySummary(date: string): DailySummary | null {
  const filePath = path.join(dateToPath(date), "summary.json");
  return readJsonFile<DailySummary>(filePath);
}

/**
 * Read market.json for a given date.
 */
export function getMarketData(date: string): MarketData | null {
  const filePath = path.join(dateToPath(date), "market.json");
  return readJsonFile<MarketData>(filePath);
}

/**
 * Filter articles by category for a given date.
 */
export function getArticlesByCategory(
  date: string,
  category: string
): Article[] {
  const data = getDailyArticles(date);
  if (!data) return [];
  return data.articles.filter((a) => a.category === category);
}

/**
 * Find articles mentioning a stock code across all dates.
 */
export function getArticlesByStock(
  code: string
): { date: string; articles: Article[] }[] {
  const dates = getAvailableDates();
  const results: { date: string; articles: Article[] }[] = [];

  for (const date of dates) {
    const data = getDailyArticles(date);
    if (!data) continue;
    const matched = data.articles.filter((a) => a.stocks.includes(code));
    if (matched.length > 0) {
      results.push({ date, articles: matched });
    }
  }

  return results;
}

/**
 * Get historical market data across all available dates (newest first).
 */
export function getHistoricalMarketData(): MarketData[] {
  const dates = getAvailableDates();
  const results: MarketData[] = [];

  for (const date of dates) {
    const market = getMarketData(date);
    if (market) results.push(market);
  }

  return results;
}

/**
 * Get all articles across all dates, with date attached.
 */
export function getAllArticles(): { date: string; article: Article }[] {
  const dates = getAvailableDates();
  const results: { date: string; article: Article }[] = [];

  for (const date of dates) {
    const data = getDailyArticles(date);
    if (!data) continue;
    for (const article of data.articles) {
      results.push({ date, article });
    }
  }

  return results;
}

/**
 * Get dates within a week (Mon-Sun) containing the given date.
 */
export function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + "T00:00:00+08:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));

  const available = new Set(getAvailableDates());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const str = cur.toISOString().slice(0, 10);
    if (available.has(str)) dates.push(str);
  }
  return dates;
}

/**
 * Get dates within a month (YYYY-MM) that have data.
 */
export function getMonthDates(yearMonth: string): string[] {
  const available = getAvailableDates();
  return available.filter((d) => d.startsWith(yearMonth));
}

/**
 * Get available weeks as [startDate, endDate] pairs.
 */
export function getAvailableWeeks(): { label: string; start: string; end: string }[] {
  const dates = getAvailableDates();
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

/**
 * Get available months as YYYY-MM strings.
 */
export function getAvailableMonths(): string[] {
  const dates = getAvailableDates();
  const months = new Set<string>();
  for (const d of dates) {
    months.add(d.slice(0, 7));
  }
  return Array.from(months).sort().reverse();
}

/**
 * Build a map of stock code → name from all market data.
 */
export function getStockNameMap(): Record<string, string> {
  const dates = getAvailableDates();
  const map: Record<string, string> = {};

  for (const date of dates) {
    const market = getMarketData(date);
    if (!market) continue;
    for (const mover of market.topMovers) {
      if (mover.code && mover.name) {
        map[mover.code] = mover.name;
      }
    }
  }

  return map;
}

/**
 * Get all unique stock codes from all data.
 */
export function getAllStockCodes(): string[] {
  const dates = getAvailableDates();
  const codes = new Set<string>();

  for (const date of dates) {
    const data = getDailyArticles(date);
    if (!data) continue;
    for (const article of data.articles) {
      for (const code of article.stocks) {
        codes.add(code);
      }
    }
  }

  return Array.from(codes).sort();
}
