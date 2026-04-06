export interface Article {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  category: "台股" | "國際" | "產業" | "政策";
  stocks: string[];
  summary: string;
  publishedAt: string;
}

export interface ArticlesData {
  date: string;
  articles: Article[];
}

export interface DailySummary {
  date: string;
  overview: string;
  highlights: string[];
  categorySummaries: Record<string, string>;
}

export interface MarketIndex {
  close: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface StockMover {
  code: string;
  name: string;
  close: number;
  change: number;
  changePercent: number;
}

export interface MarketData {
  date: string;
  taiex: MarketIndex;
  topMovers: StockMover[];
}
