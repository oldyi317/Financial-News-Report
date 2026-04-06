# Daily Financial News Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated daily Taiwan stock market news aggregation website with AI-powered summaries.

**Architecture:** Next.js 15 SSG frontend reads JSON data files. Python scripts collect news via RSS/scraping, process with Claude API for summaries and categorization. GitHub Actions runs daily, commits JSON data, triggers Vercel redeployment.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Python 3.11+ (feedparser, requests, beautifulsoup4, anthropic), GitHub Actions, Vercel

**Design Spec:** `docs/superpowers/specs/2026-04-06-daily-finance-news-design.md`

---

## Dependency Graph

```
Task 1 (Scaffold)
  └─> Task 2 (Mock Data + data.ts)
        ├─> Task 3 (Homepage: Summary + Market)
        │     └─> Task 4 (Homepage: Articles + Tabs)
        │           └─> Task 5 (Daily + Category pages)
        │                 └─> Task 6 (Stock + Archive pages)
        └─> Task 7 (Python Collection) ← can parallel with 3-6
              └─> Task 8 (AI Summary)
                    └─> Task 9 (GitHub Actions)
  Task 6 + Task 9 ─> Task 10 (Polish + Deploy)
```

---

### Task 1: Repository Initialization and Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Fix git remote and reinitialize**

```bash
cd "/mnt/d/Tommy/Financial News Report"
git remote remove origin
```

- [ ] **Step 2: Scaffold Next.js project**

```bash
cd "/mnt/d/Tommy/Financial News Report"
npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-npm --no-import-alias
```

If the directory is not empty and it fails, use `--yes` or manually create files. Accept all defaults.

- [ ] **Step 3: Configure dark theme in Tailwind**

Edit `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        background: "#0a0a0a",
        surface: "#111111",
        border: "#333333",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Set up root layout with dark theme and Noto Sans TC**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "每日財經新聞",
  description: "AI 驅動的每日台股財經新聞自動整理",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body
        className={`${notoSansTC.className} bg-background text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Set up globals.css for dark theme**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0a0a0a;
  color: #e5e5e5;
}
```

- [ ] **Step 6: Create placeholder homepage**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center">📊 每日財經新聞</h1>
      <p className="text-center text-gray-400 mt-4">網站建置中...</p>
    </main>
  );
}
```

- [ ] **Step 7: Verify dev server runs**

```bash
cd "/mnt/d/Tommy/Financial News Report"
npm run dev
```

Expected: Dark themed page at http://localhost:3000 with "每日財經新聞" title.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with dark theme and Tailwind CSS"
```

---

### Task 2: Mock Data and Data Access Layer

**Files:**
- Create: `data/2026/04/05/articles.json`, `data/2026/04/05/summary.json`, `data/2026/04/05/market.json`
- Create: `data/2026/04/06/articles.json`, `data/2026/04/06/summary.json`, `data/2026/04/06/market.json`
- Create: `src/lib/types.ts`
- Create: `src/lib/data.ts`

- [ ] **Step 1: Create TypeScript interfaces**

Create `src/lib/types.ts`:

```typescript
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
```

- [ ] **Step 2: Create mock data for 2026/04/06**

Create `data/2026/04/06/articles.json`:

```json
{
  "date": "2026-04-06",
  "articles": [
    {
      "id": "a1",
      "title": "台積電Q1營收超預期 法說會釋出正面展望",
      "source": "鉅亨網",
      "sourceUrl": "https://news.cnyes.com/example1",
      "category": "台股",
      "stocks": ["2330"],
      "summary": "台積電第一季營收達 5,926 億元，年增 35%，超出市場預期。法說會上管理層對 AI 晶片需求表達樂觀看法。",
      "publishedAt": "2026-04-06T08:30:00+08:00"
    },
    {
      "id": "a2",
      "title": "聯發科搶攻車用晶片市場 攜手國際車廠",
      "source": "經濟日報",
      "sourceUrl": "https://money.udn.com/example2",
      "category": "台股",
      "stocks": ["2454"],
      "summary": "聯發科宣布與多家國際車廠合作，將天璣系列晶片導入車用市場，預計下半年開始出貨。",
      "publishedAt": "2026-04-06T09:15:00+08:00"
    },
    {
      "id": "a3",
      "title": "外資連續五日買超台股 金額突破千億",
      "source": "MoneyDJ",
      "sourceUrl": "https://www.moneydj.com/example3",
      "category": "台股",
      "stocks": [],
      "summary": "外資本週連續五個交易日買超台股，累計買超金額達 1,230 億元，市場信心回溫。",
      "publishedAt": "2026-04-06T10:00:00+08:00"
    },
    {
      "id": "a4",
      "title": "Fed宣布維持利率不變 暗示年內降息兩次",
      "source": "鉅亨網",
      "sourceUrl": "https://news.cnyes.com/example4",
      "category": "國際",
      "stocks": [],
      "summary": "聯準會維持聯邦基金利率在 4.75-5.00% 區間不變，點陣圖顯示年內可能降息兩次。",
      "publishedAt": "2026-04-06T07:00:00+08:00"
    },
    {
      "id": "a5",
      "title": "輝達發表新一代AI晶片 效能提升三倍",
      "source": "鉅亨網",
      "sourceUrl": "https://news.cnyes.com/example5",
      "category": "國際",
      "stocks": [],
      "summary": "輝達發表 Blackwell Ultra 架構新晶片，AI 推理效能較前代提升三倍，預計下季量產。",
      "publishedAt": "2026-04-06T08:00:00+08:00"
    },
    {
      "id": "a6",
      "title": "AI伺服器需求爆發 鴻海營收創新高",
      "source": "經濟日報",
      "sourceUrl": "https://money.udn.com/example6",
      "category": "產業",
      "stocks": ["2317"],
      "summary": "鴻海受惠 AI 伺服器訂單，3月營收達 6,800 億元，創單月歷史新高。",
      "publishedAt": "2026-04-06T11:00:00+08:00"
    },
    {
      "id": "a7",
      "title": "半導體設備廠訂單回溫 先進製程帶動成長",
      "source": "MoneyDJ",
      "sourceUrl": "https://www.moneydj.com/example7",
      "category": "產業",
      "stocks": ["2379", "3443"],
      "summary": "台灣半導體設備廠商訂單能見度提升，受惠先進製程擴廠需求，Q2 營收有望季增兩成。",
      "publishedAt": "2026-04-06T11:30:00+08:00"
    },
    {
      "id": "a8",
      "title": "金管會推動ESG揭露新規 上市櫃企業須強化氣候報告",
      "source": "經濟日報",
      "sourceUrl": "https://money.udn.com/example8",
      "category": "政策",
      "stocks": [],
      "summary": "金管會宣布自 2027 年起，所有上市櫃公司須依 IFRS S2 準則揭露氣候相關財務資訊。",
      "publishedAt": "2026-04-06T14:00:00+08:00"
    },
    {
      "id": "a9",
      "title": "台幣匯率連三升 央行關注熱錢流入",
      "source": "鉅亨網",
      "sourceUrl": "https://news.cnyes.com/example9",
      "category": "台股",
      "stocks": [],
      "summary": "新台幣兌美元連三日升值，收在 30.85 元，央行表示將密切關注短期資金流入情況。",
      "publishedAt": "2026-04-06T16:00:00+08:00"
    },
    {
      "id": "a10",
      "title": "電動車供應鏈報喜 和大工業接獲大單",
      "source": "MoneyDJ",
      "sourceUrl": "https://www.moneydj.com/example10",
      "category": "產業",
      "stocks": ["1536"],
      "summary": "和大工業獲得北美電動車廠新訂單，預估年貢獻營收達 50 億元，股價漲停。",
      "publishedAt": "2026-04-06T13:00:00+08:00"
    }
  ]
}
```

Create `data/2026/04/06/summary.json`:

```json
{
  "date": "2026-04-06",
  "overview": "今日台股在外資連續買超帶動下走揚，加權指數收漲 150 點，站上 22,150 點。台積電法說釋出正面展望，帶動半導體族群全面走強。國際方面，Fed 維持利率不變但暗示年內可能降息兩次，市場反應正面。AI 相關供應鏈持續成為盤面焦點。",
  "highlights": [
    "台積電Q1營收超預期，法說會釋出AI晶片需求正面展望",
    "外資連續五日買超台股，累計金額突破千億",
    "Fed維持利率不變，點陣圖暗示年內降息兩次",
    "鴻海3月營收創歷史新高，AI伺服器需求爆發",
    "金管會推動ESG揭露新規，2027年起強制實施"
  ],
  "categorySummaries": {
    "台股": "加權指數收漲 150 點至 22,150 點，成交量 3,250 億元。外資連五日買超，台積電法說後股價強勢表態，帶動半導體族群全面走揚。新台幣匯率連三升，央行持續關注資金流向。",
    "國際": "Fed 維持利率不變，點陣圖暗示年內可能降息兩次，美股三大指數收高。輝達發表新一代 Blackwell Ultra AI 晶片，效能較前代提升三倍，AI 供應鏈受惠股全面走強。",
    "產業": "AI 伺服器需求爆發，鴻海 3 月營收創單月歷史新高。半導體設備廠訂單回溫，先進製程擴廠需求帶動成長。電動車供應鏈同步報喜，和大工業接獲北美大單。",
    "政策": "金管會宣布自 2027 年起強制上市櫃公司依 IFRS S2 準則揭露氣候相關財務資訊，強化 ESG 報告要求。市場預期將增加企業合規成本，但有助提升國際投資人信心。"
  }
}
```

Create `data/2026/04/06/market.json`:

```json
{
  "date": "2026-04-06",
  "taiex": {
    "close": 22150,
    "change": 150,
    "changePercent": 0.68,
    "volume": 325000000000
  },
  "topMovers": [
    { "code": "2330", "name": "台積電", "close": 890, "change": 15, "changePercent": 1.71 },
    { "code": "2454", "name": "聯發科", "close": 1250, "change": 30, "changePercent": 2.46 },
    { "code": "2317", "name": "鴻海", "close": 178, "change": 8, "changePercent": 4.71 },
    { "code": "1536", "name": "和大", "close": 285, "change": 26, "changePercent": 10.04 },
    { "code": "2379", "name": "瑞昱", "close": 520, "change": 12, "changePercent": 2.36 }
  ]
}
```

- [ ] **Step 3: Create mock data for 2026/04/05**

Create `data/2026/04/05/articles.json`:

```json
{
  "date": "2026-04-05",
  "articles": [
    {
      "id": "b1",
      "title": "台股開盤走高 半導體族群領漲",
      "source": "鉅亨網",
      "sourceUrl": "https://news.cnyes.com/example-b1",
      "category": "台股",
      "stocks": ["2330", "2454"],
      "summary": "台股今日開盤走高，半導體族群領漲，台積電、聯發科同步上攻。",
      "publishedAt": "2026-04-05T09:00:00+08:00"
    },
    {
      "id": "b2",
      "title": "美股收紅 科技股帶動那斯達克指數上漲",
      "source": "鉅亨網",
      "sourceUrl": "https://news.cnyes.com/example-b2",
      "category": "國際",
      "stocks": [],
      "summary": "美股三大指數收紅，那斯達克指數上漲 1.2%，科技股表現強勁。",
      "publishedAt": "2026-04-05T07:00:00+08:00"
    },
    {
      "id": "b3",
      "title": "面板產業復甦 友達群創營收回溫",
      "source": "經濟日報",
      "sourceUrl": "https://money.udn.com/example-b3",
      "category": "產業",
      "stocks": ["2409", "3481"],
      "summary": "面板雙虎友達、群創 3 月營收均較上月成長逾一成，面板報價回穩。",
      "publishedAt": "2026-04-05T10:30:00+08:00"
    },
    {
      "id": "b4",
      "title": "央行升息半碼 房貸族壓力增",
      "source": "經濟日報",
      "sourceUrl": "https://money.udn.com/example-b4",
      "category": "政策",
      "stocks": [],
      "summary": "央行宣布升息半碼至 2.25%，為連續第三季升息，房貸利率將同步調升。",
      "publishedAt": "2026-04-05T16:00:00+08:00"
    }
  ]
}
```

Create `data/2026/04/05/summary.json`:

```json
{
  "date": "2026-04-05",
  "overview": "台股今日在半導體族群帶動下走高，加權指數收漲 80 點至 22,000 點。美股隔夜收紅提供正面氛圍。面板產業出現復甦跡象，友達群創營收回溫。央行宣布升息半碼。",
  "highlights": [
    "台股收漲 80 點，半導體族群領漲",
    "美股科技股帶動那斯達克上漲 1.2%",
    "面板雙虎營收回溫，產業復甦",
    "央行升息半碼至 2.25%"
  ],
  "categorySummaries": {
    "台股": "加權指數收漲 80 點至 22,000 點，成交量 2,800 億元。半導體族群領漲，台積電、聯發科同步走揚。",
    "國際": "美股三大指數收紅，那斯達克指數上漲 1.2%，科技股表現強勁，為台股提供正面氛圍。",
    "產業": "面板產業出現復甦跡象，友達、群創 3 月營收均較上月成長逾一成。面板報價持續回穩。",
    "政策": "央行宣布升息半碼至 2.25%，為連續第三季升息。房貸利率將同步調升，增加房貸族負擔。"
  }
}
```

Create `data/2026/04/05/market.json`:

```json
{
  "date": "2026-04-05",
  "taiex": {
    "close": 22000,
    "change": 80,
    "changePercent": 0.36,
    "volume": 280000000000
  },
  "topMovers": [
    { "code": "2330", "name": "台積電", "close": 875, "change": 10, "changePercent": 1.16 },
    { "code": "2454", "name": "聯發科", "close": 1220, "change": 25, "changePercent": 2.09 },
    { "code": "2409", "name": "友達", "close": 18.5, "change": 1.2, "changePercent": 6.94 },
    { "code": "3481", "name": "群創", "close": 14.8, "change": 0.9, "changePercent": 6.47 }
  ]
}
```

- [ ] **Step 4: Create data access layer**

Create `src/lib/data.ts`:

```typescript
import fs from "fs";
import path from "path";
import type { ArticlesData, DailySummary, MarketData, Article } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getAvailableDates(): string[] {
  const dates: string[] = [];
  const dataDir = DATA_DIR;

  if (!fs.existsSync(dataDir)) return dates;

  const years = fs.readdirSync(dataDir).filter((f) => /^\d{4}$/.test(f));
  for (const year of years) {
    const months = fs
      .readdirSync(path.join(dataDir, year))
      .filter((f) => /^\d{2}$/.test(f));
    for (const month of months) {
      const days = fs
        .readdirSync(path.join(dataDir, year, month))
        .filter((f) => /^\d{2}$/.test(f));
      for (const day of days) {
        dates.push(`${year}-${month}-${day}`);
      }
    }
  }

  return dates.sort().reverse();
}

export function getLatestDate(): string | null {
  const dates = getAvailableDates();
  return dates.length > 0 ? dates[0] : null;
}

function datePath(date: string): string {
  const [year, month, day] = date.split("-");
  return path.join(DATA_DIR, year, month, day);
}

export function getDailyArticles(date: string): ArticlesData | null {
  const filePath = path.join(datePath(date), "articles.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getDailySummary(date: string): DailySummary | null {
  const filePath = path.join(datePath(date), "summary.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getMarketData(date: string): MarketData | null {
  const filePath = path.join(datePath(date), "market.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getArticlesByCategory(
  date: string,
  category: string
): Article[] {
  const data = getDailyArticles(date);
  if (!data) return [];
  return data.articles.filter((a) => a.category === category);
}

export function getArticlesByStock(code: string): {
  date: string;
  articles: Article[];
}[] {
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

export function getAllStockCodes(): string[] {
  const codes = new Set<string>();
  const dates = getAvailableDates();

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
```

- [ ] **Step 5: Verify data layer works**

Create a temporary test in `src/app/page.tsx`:

```tsx
import { getLatestDate, getDailySummary } from "@/lib/data";

export default function Home() {
  const date = getLatestDate();
  const summary = date ? getDailySummary(date) : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center">📊 每日財經新聞</h1>
      <p className="text-center text-gray-400 mt-4">
        最新日期: {date ?? "無資料"}
      </p>
      {summary && (
        <p className="text-gray-300 mt-4 text-center">{summary.overview}</p>
      )}
    </main>
  );
}
```

Run: `npm run dev`
Expected: Page shows "最新日期: 2026-04-06" and the overview text.

- [ ] **Step 6: Commit**

```bash
git add data/ src/lib/types.ts src/lib/data.ts src/app/page.tsx
git commit -m "feat: add mock data and data access layer with TypeScript types"
```

---

### Task 3: Homepage — Daily Summary and Market Indicators

**Files:**
- Create: `src/components/DailySummary.tsx`
- Create: `src/components/MarketIndicators.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create DailySummary component**

Create `src/components/DailySummary.tsx`:

```tsx
import type { DailySummary as DailySummaryType } from "@/lib/types";

export default function DailySummary({
  summary,
}: {
  summary: DailySummaryType;
}) {
  return (
    <section className="bg-surface border-l-4 border-primary rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-3">今日重點摘要</h2>
      <p className="text-gray-300 leading-relaxed mb-4">{summary.overview}</p>
      <ul className="space-y-2">
        {summary.highlights.map((highlight, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-400">
            <span className="text-primary mt-1">•</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Create MarketIndicators component**

Create `src/components/MarketIndicators.tsx`:

```tsx
import type { MarketData } from "@/lib/types";

function formatVolume(volume: number): string {
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(0)}億`;
  }
  return volume.toLocaleString();
}

function ChangeText({
  change,
  changePercent,
}: {
  change: number;
  changePercent: number;
}) {
  const isPositive = change >= 0;
  const color = isPositive ? "text-green-400" : "text-red-400";
  const arrow = isPositive ? "▲" : "▼";

  return (
    <span className={color}>
      {arrow} {Math.abs(change).toFixed(change % 1 === 0 ? 0 : 2)} (
      {Math.abs(changePercent).toFixed(2)}%)
    </span>
  );
}

export default function MarketIndicators({ market }: { market: MarketData }) {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-gray-500 mb-1">加權指數</div>
          <div className="text-xl font-bold">
            {market.taiex.close.toLocaleString()}
          </div>
          <ChangeText
            change={market.taiex.change}
            changePercent={market.taiex.changePercent}
          />
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-gray-500 mb-1">成交量</div>
          <div className="text-xl font-bold">
            {formatVolume(market.taiex.volume)}
          </div>
        </div>
        {market.topMovers.slice(0, 2).map((stock) => (
          <div
            key={stock.code}
            className="bg-surface rounded-lg p-4 border border-border"
          >
            <div className="text-sm text-gray-500 mb-1">
              {stock.code} {stock.name}
            </div>
            <div className="text-xl font-bold">{stock.close}</div>
            <ChangeText
              change={stock.change}
              changePercent={stock.changePercent}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update homepage to use components**

Replace `src/app/page.tsx`:

```tsx
import { getLatestDate, getDailySummary, getMarketData } from "@/lib/data";
import DailySummaryComponent from "@/components/DailySummary";
import MarketIndicators from "@/components/MarketIndicators";

export default function Home() {
  const date = getLatestDate();

  if (!date) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">📊 每日財經新聞</h1>
        <p className="text-gray-400 mt-4">尚無新聞資料</p>
      </main>
    );
  }

  const summary = getDailySummary(date);
  const market = getMarketData(date);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">📊 每日財經新聞</h1>
        <p className="text-gray-500 mt-2">{date}</p>
      </header>

      {summary && <DailySummaryComponent summary={summary} />}
      {market && <MarketIndicators market={market} />}
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`
Expected: Homepage shows daily summary card with blue left border, and 4 market indicator cards in a grid.

- [ ] **Step 5: Commit**

```bash
git add src/components/DailySummary.tsx src/components/MarketIndicators.tsx src/app/page.tsx
git commit -m "feat: add daily summary and market indicators to homepage"
```

---

### Task 4: Homepage — Article List with Category Tabs

**Files:**
- Create: `src/components/CategoryTabs.tsx`
- Create: `src/components/ArticleCard.tsx`
- Create: `src/components/ArticleList.tsx`
- Create: `src/components/StockBadge.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create StockBadge component**

Create `src/components/StockBadge.tsx`:

```tsx
import Link from "next/link";

export default function StockBadge({ code }: { code: string }) {
  return (
    <Link
      href={`/stock/${code}`}
      className="inline-block bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded-full hover:bg-blue-900/80 transition-colors"
    >
      {code}
    </Link>
  );
}
```

- [ ] **Step 2: Create ArticleCard component**

Create `src/components/ArticleCard.tsx`:

```tsx
import type { Article } from "@/lib/types";
import StockBadge from "./StockBadge";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="bg-surface border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="font-bold text-white hover:text-primary transition-colors mb-2">
          {article.title}
        </h3>
      </a>
      <p className="text-sm text-gray-400 mb-3">{article.summary}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{article.source}</span>
          <span className="text-xs text-gray-600">
            {formatTime(article.publishedAt)}
          </span>
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
```

- [ ] **Step 3: Create ArticleList component**

Create `src/components/ArticleList.tsx`:

```tsx
import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";

export default function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return <p className="text-gray-500 text-center py-8">暫無新聞</p>;
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create CategoryTabs component (client component)**

Create `src/components/CategoryTabs.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";
import ArticleList from "./ArticleList";

const CATEGORIES = ["全部", "台股", "國際", "產業", "政策"] as const;

export default function CategoryTabs({ articles }: { articles: Article[] }) {
  const [activeTab, setActiveTab] = useState<string>("全部");

  const filtered =
    activeTab === "全部"
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
```

- [ ] **Step 5: Add hot stocks section and update homepage**

Replace `src/app/page.tsx`:

```tsx
import {
  getLatestDate,
  getDailySummary,
  getMarketData,
  getDailyArticles,
} from "@/lib/data";
import DailySummaryComponent from "@/components/DailySummary";
import MarketIndicators from "@/components/MarketIndicators";
import CategoryTabs from "@/components/CategoryTabs";
import StockBadge from "@/components/StockBadge";
import type { Article } from "@/lib/types";

function getHotStocks(articles: Article[]): { code: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const article of articles) {
    for (const code of article.stocks) {
      counts[code] = (counts[code] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default function Home() {
  const date = getLatestDate();

  if (!date) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">📊 每日財經新聞</h1>
        <p className="text-gray-400 mt-4">尚無新聞資料</p>
      </main>
    );
  }

  const summary = getDailySummary(date);
  const market = getMarketData(date);
  const articlesData = getDailyArticles(date);
  const articles = articlesData?.articles ?? [];
  const hotStocks = getHotStocks(articles);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">📊 每日財經新聞</h1>
        <p className="text-gray-500 mt-2">{date}</p>
      </header>

      {summary && <DailySummaryComponent summary={summary} />}
      {market && <MarketIndicators market={market} />}

      <h2 className="text-xl font-bold mb-4">分類新聞</h2>
      <CategoryTabs articles={articles} />

      {hotStocks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">熱門個股</h2>
          <div className="flex gap-3 flex-wrap">
            {hotStocks.map(({ code, count }) => (
              <div
                key={code}
                className="bg-surface border border-border rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <StockBadge code={code} />
                <span className="text-xs text-gray-500">{count} 則新聞</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center text-xs text-gray-600 py-8 border-t border-border mt-8">
        <p>資料來源：鉅亨網、經濟日報、Yahoo 奇摩股市、MoneyDJ</p>
        <p className="mt-1">最後更新：{date}</p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run dev`
Expected: Full homepage with summary, market indicators, category tabs (clicking tabs filters articles), hot stocks section, and footer.

- [ ] **Step 7: Commit**

```bash
git add src/components/ src/app/page.tsx
git commit -m "feat: add article list with category tabs and hot stocks to homepage"
```

---

### Task 5: Daily Report and Category Pages

**Files:**
- Create: `src/app/daily/[date]/page.tsx`
- Create: `src/app/category/[slug]/page.tsx`
- Modify: `src/app/page.tsx` (add navigation links)
- Modify: `src/app/layout.tsx` (add nav bar)

- [ ] **Step 1: Add navigation bar to layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "每日財經新聞",
  description: "AI 驅動的每日台股財經新聞自動整理",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body
        className={`${notoSansTC.className} bg-background text-white min-h-screen`}
      >
        <nav className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-primary">
              📊 每日財經新聞
            </Link>
            <div className="flex gap-4 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                首頁
              </Link>
              <Link
                href="/archive"
                className="hover:text-white transition-colors"
              >
                歷史
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create daily report page**

Create `src/app/daily/[date]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import {
  getAvailableDates,
  getDailySummary,
  getMarketData,
  getDailyArticles,
} from "@/lib/data";
import DailySummaryComponent from "@/components/DailySummary";
import MarketIndicators from "@/components/MarketIndicators";
import CategoryTabs from "@/components/CategoryTabs";

export function generateStaticParams() {
  return getAvailableDates().map((date) => ({ date }));
}

export function generateMetadata({ params }: { params: { date: string } }) {
  return {
    title: `${params.date} — 每日財經新聞`,
    description: `${params.date} 台股財經新聞摘要`,
  };
}

export default function DailyReportPage({
  params,
}: {
  params: { date: string };
}) {
  const summary = getDailySummary(params.date);
  const market = getMarketData(params.date);
  const articlesData = getDailyArticles(params.date);

  if (!summary && !articlesData) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{params.date} 財經新聞報告</h1>

      {summary && <DailySummaryComponent summary={summary} />}
      {market && <MarketIndicators market={market} />}

      {articlesData && (
        <>
          <h2 className="text-xl font-bold mb-4">當日新聞</h2>
          <CategoryTabs articles={articlesData.articles} />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Create category page**

Create `src/app/category/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getLatestDate, getDailyArticles } from "@/lib/data";
import ArticleList from "@/components/ArticleList";

const SLUG_TO_CATEGORY: Record<string, string> = {
  "taiwan-stock": "台股",
  international: "國際",
  industry: "產業",
  policy: "政策",
};

const ALL_SLUGS = Object.keys(SLUG_TO_CATEGORY);

export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const category = SLUG_TO_CATEGORY[params.slug];
  return {
    title: `${category ?? params.slug} — 每日財經新聞`,
    description: `${category ?? params.slug}類財經新聞`,
  };
}

export default function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = SLUG_TO_CATEGORY[params.slug];
  if (!category) notFound();

  const date = getLatestDate();
  if (!date) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">尚無新聞資料</p>
      </main>
    );
  }

  const articlesData = getDailyArticles(date);
  const articles =
    articlesData?.articles.filter((a) => a.category === category) ?? [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{category}</h1>
      <p className="text-gray-500 mb-6">{date}</p>
      <ArticleList articles={articles} />
    </main>
  );
}
```

- [ ] **Step 4: Add link to daily report from homepage**

In `src/app/page.tsx`, add a link below the header date. Change the date line from:

```tsx
        <p className="text-gray-500 mt-2">{date}</p>
```

to:

```tsx
        <p className="text-gray-500 mt-2">
          <Link href={`/daily/${date}`} className="hover:text-primary transition-colors">
            {date} →
          </Link>
        </p>
```

Add the import at top: `import Link from "next/link";`

- [ ] **Step 5: Verify build succeeds**

```bash
npm run build
```

Expected: Build succeeds. Static pages generated for `/`, `/daily/2026-04-05`, `/daily/2026-04-06`, `/category/taiwan-stock`, `/category/international`, `/category/industry`, `/category/policy`.

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/components/
git commit -m "feat: add daily report and category pages with navigation"
```

---

### Task 6: Stock Page and Archive Page

**Files:**
- Create: `src/app/stock/[code]/page.tsx`
- Create: `src/app/archive/page.tsx`
- Create: `src/components/Calendar.tsx`

- [ ] **Step 1: Create stock page**

Create `src/app/stock/[code]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getAllStockCodes, getArticlesByStock } from "@/lib/data";
import ArticleCard from "@/components/ArticleCard";

export function generateStaticParams() {
  return getAllStockCodes().map((code) => ({ code }));
}

export function generateMetadata({ params }: { params: { code: string } }) {
  return {
    title: `${params.code} 相關新聞 — 每日財經新聞`,
    description: `股票代號 ${params.code} 的相關財經新聞`,
  };
}

export default function StockPage({ params }: { params: { code: string } }) {
  const results = getArticlesByStock(params.code);

  if (results.length === 0) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        <span className="text-primary">{params.code}</span> 相關新聞
      </h1>

      {results.map(({ date, articles }) => (
        <section key={date} className="mb-8">
          <h2 className="text-lg font-medium text-gray-400 mb-3">{date}</h2>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Create Calendar component**

Create `src/components/Calendar.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface CalendarProps {
  availableDates: string[];
}

export default function Calendar({ availableDates }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const dateSet = new Set(availableDates);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  function formatDate(day: number): string {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月",
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="text-gray-400 hover:text-white transition-colors px-2"
        >
          ←
        </button>
        <h3 className="text-lg font-bold">
          {year} {monthNames[month]}
        </h3>
        <button
          onClick={nextMonth}
          className="text-gray-400 hover:text-white transition-colors px-2"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
          <div key={d} className="text-gray-500 py-1 font-medium">
            {d}
          </div>
        ))}

        {weeks.flat().map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const dateStr = formatDate(day);
          const hasData = dateSet.has(dateStr);

          if (hasData) {
            return (
              <Link
                key={dateStr}
                href={`/daily/${dateStr}`}
                className="py-2 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/40 transition-colors"
              >
                {day}
              </Link>
            );
          }

          return (
            <div key={`day-${i}`} className="py-2 text-gray-600">
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create archive page**

Create `src/app/archive/page.tsx`:

```tsx
import { getAvailableDates } from "@/lib/data";
import Calendar from "@/components/Calendar";

export const metadata = {
  title: "歷史回顧 — 每日財經新聞",
  description: "瀏覽過去的每日財經新聞報告",
};

export default function ArchivePage() {
  const dates = getAvailableDates();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">歷史回顧</h1>
      <p className="text-gray-400 mb-6">
        點擊有標記的日期查看當天的財經新聞報告
      </p>
      <div className="max-w-md mx-auto">
        <Calendar availableDates={dates} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds. All stock and archive pages generated. Navigate between pages to verify links.

- [ ] **Step 5: Commit**

```bash
git add src/app/stock/ src/app/archive/ src/components/Calendar.tsx
git commit -m "feat: add stock detail page and archive page with calendar"
```

---

### Task 7: Python News Collection Scripts

**Files:**
- Create: `scripts/collect_news.py`
- Create: `scripts/fetch_market_data.py`
- Create: `scripts/requirements.txt`

- [ ] **Step 1: Create requirements.txt**

Create `scripts/requirements.txt`:

```
feedparser>=6.0
requests>=2.31
beautifulsoup4>=4.12
lxml>=5.0
anthropic>=0.40
```

- [ ] **Step 2: Install dependencies**

```bash
cd "/mnt/d/Tommy/Financial News Report"
pip install -r scripts/requirements.txt
```

- [ ] **Step 3: Create news collection script**

Create `scripts/collect_news.py`:

```python
"""Collect financial news from RSS feeds and web scraping."""

import json
import os
import uuid
from datetime import datetime, timezone, timedelta
from difflib import SequenceMatcher
from pathlib import Path

import feedparser
import requests
from bs4 import BeautifulSoup

TW_TZ = timezone(timedelta(hours=8))

RSS_SOURCES = {
    "鉅亨網": [
        "https://news.cnyes.com/news/cat/tw_stock/rss",
        "https://news.cnyes.com/news/cat/wd_stock/rss",
    ],
    "經濟日報": [
        "https://money.udn.com/rssfeed/news/1001/5710",
        "https://money.udn.com/rssfeed/news/1001/5607",
    ],
    "MoneyDJ": [
        "https://www.moneydj.com/rss/rsscontent.aspx?svc=NW&fno=1",
    ],
    "Google News": [
        "https://news.google.com/rss/search?q=台股+when:1d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant",
    ],
}


def fetch_rss_articles(source_name: str, urls: list[str]) -> list[dict]:
    """Fetch articles from RSS feed URLs."""
    articles = []
    for url in urls:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                published = entry.get("published_parsed")
                if published:
                    pub_dt = datetime(*published[:6], tzinfo=TW_TZ)
                else:
                    pub_dt = datetime.now(TW_TZ)

                articles.append({
                    "id": str(uuid.uuid4())[:8],
                    "title": entry.get("title", "").strip(),
                    "source": source_name,
                    "sourceUrl": entry.get("link", ""),
                    "category": "",
                    "stocks": [],
                    "summary": entry.get("summary", "").strip()[:200],
                    "publishedAt": pub_dt.isoformat(),
                })
        except Exception as e:
            print(f"Error fetching RSS from {source_name} ({url}): {e}")
    return articles


def scrape_yahoo_finance_tw() -> list[dict]:
    """Scrape news from Yahoo Finance Taiwan."""
    articles = []
    url = "https://tw.stock.yahoo.com/news"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        for item in soup.select("li.js-stream-content")[:15]:
            title_el = item.select_one("h3")
            link_el = item.select_one("a")
            if not title_el or not link_el:
                continue

            title = title_el.get_text(strip=True)
            link = link_el.get("href", "")
            if link.startswith("/"):
                link = "https://tw.stock.yahoo.com" + link

            articles.append({
                "id": str(uuid.uuid4())[:8],
                "title": title,
                "source": "Yahoo 奇摩股市",
                "sourceUrl": link,
                "category": "",
                "stocks": [],
                "summary": "",
                "publishedAt": datetime.now(TW_TZ).isoformat(),
            })
    except Exception as e:
        print(f"Error scraping Yahoo Finance TW: {e}")
    return articles


def deduplicate(articles: list[dict], threshold: float = 0.7) -> list[dict]:
    """Remove duplicate articles based on title similarity."""
    unique = []
    for article in articles:
        is_dup = False
        for existing in unique:
            ratio = SequenceMatcher(
                None, article["title"], existing["title"]
            ).ratio()
            if ratio > threshold:
                is_dup = True
                break
        if not is_dup:
            unique.append(article)
    return unique


def collect_all() -> list[dict]:
    """Collect articles from all sources and deduplicate."""
    all_articles = []

    for source, urls in RSS_SOURCES.items():
        print(f"Fetching from {source}...")
        articles = fetch_rss_articles(source, urls)
        print(f"  Got {len(articles)} articles")
        all_articles.extend(articles)

    print("Scraping Yahoo Finance TW...")
    yahoo_articles = scrape_yahoo_finance_tw()
    print(f"  Got {len(yahoo_articles)} articles")
    all_articles.extend(yahoo_articles)

    print(f"Total before dedup: {len(all_articles)}")
    all_articles = deduplicate(all_articles)
    print(f"Total after dedup: {len(all_articles)}")

    return all_articles


def save_articles(articles: list[dict], date_str: str | None = None) -> str:
    """Save articles to data directory. Returns the output path."""
    if date_str is None:
        now = datetime.now(TW_TZ)
        date_str = now.strftime("%Y-%m-%d")

    year, month, day = date_str.split("-")
    out_dir = Path(__file__).parent.parent / "data" / year / month / day
    out_dir.mkdir(parents=True, exist_ok=True)

    output = {"date": date_str, "articles": articles}
    out_path = out_dir / "articles.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(articles)} articles to {out_path}")
    return str(out_path)


def main():
    articles = collect_all()
    save_articles(articles)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Create market data script**

Create `scripts/fetch_market_data.py`:

```python
"""Fetch Taiwan stock market data (TAIEX index and top movers)."""

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup

TW_TZ = timezone(timedelta(hours=8))


def fetch_taiex() -> dict | None:
    """Fetch TAIEX index data from TWSE."""
    url = "https://www.twse.com.tw/exchangeReport/MI_INDEX"
    params = {
        "response": "json",
        "date": datetime.now(TW_TZ).strftime("%Y%m%d"),
        "type": "IND",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        data = resp.json()

        if "data8" not in data:
            print("No TAIEX data available (market may be closed)")
            return None

        for row in data["data8"]:
            if "加權" in row[0] and "指數" in row[0]:
                close_str = row[1].replace(",", "")
                change_str = row[2].replace(",", "")

                close = float(close_str)
                change = float(change_str)
                prev = close - change
                change_pct = (change / prev * 100) if prev != 0 else 0

                return {
                    "close": close,
                    "change": change,
                    "changePercent": round(change_pct, 2),
                    "volume": 0,
                }
    except Exception as e:
        print(f"Error fetching TAIEX: {e}")
    return None


def fetch_top_movers() -> list[dict]:
    """Fetch top stock movers from TWSE."""
    url = "https://www.twse.com.tw/exchangeReport/MI_INDEX"
    params = {
        "response": "json",
        "date": datetime.now(TW_TZ).strftime("%Y%m%d"),
        "type": "ALLBUT0999",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    movers = []
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=30)
        data = resp.json()

        if "data9" not in data:
            print("No stock data available")
            return movers

        rows = data["data9"]
        parsed = []
        for row in rows:
            try:
                code = row[0].strip()
                name = row[1].strip()
                close_str = row[8].replace(",", "")
                change_str = row[9].replace(",", "")
                volume_str = row[2].replace(",", "")

                if close_str == "--" or change_str == "--":
                    continue

                close = float(close_str)
                change = float(change_str)
                direction = row[9].strip() if len(row) > 9 else ""

                if "green" in str(row) or direction.startswith("-"):
                    change = -abs(change)

                prev = close - change
                change_pct = (change / prev * 100) if prev != 0 else 0

                parsed.append({
                    "code": code,
                    "name": name,
                    "close": close,
                    "change": round(change, 2),
                    "changePercent": round(change_pct, 2),
                })
            except (ValueError, IndexError):
                continue

        parsed.sort(key=lambda x: abs(x["changePercent"]), reverse=True)
        movers = parsed[:10]
    except Exception as e:
        print(f"Error fetching top movers: {e}")
    return movers


def save_market_data(date_str: str | None = None) -> str:
    """Fetch and save market data."""
    if date_str is None:
        now = datetime.now(TW_TZ)
        date_str = now.strftime("%Y-%m-%d")

    taiex = fetch_taiex()
    if taiex is None:
        taiex = {"close": 0, "change": 0, "changePercent": 0, "volume": 0}

    top_movers = fetch_top_movers()

    year, month, day = date_str.split("-")
    out_dir = Path(__file__).parent.parent / "data" / year / month / day
    out_dir.mkdir(parents=True, exist_ok=True)

    output = {
        "date": date_str,
        "taiex": taiex,
        "topMovers": top_movers,
    }

    out_path = out_dir / "market.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved market data to {out_path}")
    return str(out_path)


def main():
    save_market_data()


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Verify scripts run**

```bash
cd "/mnt/d/Tommy/Financial News Report"
python scripts/collect_news.py
python scripts/fetch_market_data.py
```

Expected: Scripts print progress and create JSON files in `data/YYYY/MM/DD/`. Check that `articles.json` has real news titles and `market.json` has TAIEX data (or zeros if market is closed).

- [ ] **Step 6: Commit**

```bash
git add scripts/
git commit -m "feat: add Python news collection and market data scripts"
```

---

### Task 8: AI Summary Generation Script

**Files:**
- Create: `scripts/generate_summary.py`

- [ ] **Step 1: Create AI summary script**

Create `scripts/generate_summary.py`:

```python
"""Generate AI-powered summaries and categorization using Claude API."""

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import anthropic

TW_TZ = timezone(timedelta(hours=8))

CATEGORIES = ["台股", "國際", "產業", "政策"]

CATEGORIZE_PROMPT = """你是一位台灣財經新聞分類專家。請為以下新聞分類並提取資訊。

對於每則新聞，請回傳：
1. category: 分類為其中一個：台股、國際、產業、政策
2. stocks: 新聞中提到的台股股票代號列表（如 2330、2454），沒有則為空陣列
3. summary: 50-80字的中文摘要

請以 JSON 陣列格式回覆，每個元素包含 id, category, stocks, summary。
僅回傳 JSON，不要其他文字。

新聞列表：
{articles_text}
"""

DAILY_SUMMARY_PROMPT = """你是一位台灣財經新聞分析師。根據以下今日新聞，產生每日財經摘要。

請回傳 JSON 格式：
{{
  "overview": "200-300字的今日財經總覽",
  "highlights": ["重點1", "重點2", ...],  // 3-5個重點
  "categorySummaries": {{
    "台股": "100-150字台股摘要",
    "國際": "100-150字國際摘要",
    "產業": "100-150字產業摘要",
    "政策": "100-150字政策摘要"
  }}
}}

僅回傳 JSON，不要其他文字。

今日新聞：
{articles_text}
"""


def load_articles(date_str: str) -> dict | None:
    """Load articles.json for a given date."""
    year, month, day = date_str.split("-")
    path = Path(__file__).parent.parent / "data" / year / month / day / "articles.json"
    if not path.exists():
        print(f"No articles found for {date_str}")
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def categorize_articles(client: anthropic.Anthropic, articles: list[dict]) -> list[dict]:
    """Use Claude to categorize articles and extract stock codes."""
    # Process in batches of 10
    batch_size = 10
    all_results = []

    for i in range(0, len(articles), batch_size):
        batch = articles[i:i + batch_size]
        articles_text = "\n".join(
            f"- ID: {a['id']} | 標題: {a['title']} | 來源: {a['source']} | 內容: {a.get('summary', '')[:100]}"
            for a in batch
        )

        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": CATEGORIZE_PROMPT.format(articles_text=articles_text),
                }],
            )

            result_text = response.content[0].text.strip()
            if result_text.startswith("```"):
                result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
            results = json.loads(result_text)
            all_results.extend(results)
        except Exception as e:
            print(f"Error categorizing batch {i // batch_size + 1}: {e}")
            for a in batch:
                all_results.append({
                    "id": a["id"],
                    "category": "台股",
                    "stocks": [],
                    "summary": a.get("summary", "")[:80],
                })

    return all_results


def generate_daily_summary(client: anthropic.Anthropic, articles: list[dict]) -> dict:
    """Use Claude to generate daily summary."""
    articles_text = "\n".join(
        f"- [{a.get('category', '未分類')}] {a['title']}: {a.get('summary', '')[:100]}"
        for a in articles
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": DAILY_SUMMARY_PROMPT.format(articles_text=articles_text),
            }],
        )

        result_text = response.content[0].text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(result_text)
    except Exception as e:
        print(f"Error generating daily summary: {e}")
        return {
            "overview": "今日財經摘要產生失敗，請查看個別新聞。",
            "highlights": [],
            "categorySummaries": {cat: "" for cat in CATEGORIES},
        }


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        return

    client = anthropic.Anthropic(api_key=api_key)

    now = datetime.now(TW_TZ)
    date_str = now.strftime("%Y-%m-%d")

    data = load_articles(date_str)
    if not data:
        return

    articles = data["articles"]
    print(f"Processing {len(articles)} articles for {date_str}...")

    # Step 1: Categorize and enrich articles
    print("Categorizing articles...")
    enrichments = categorize_articles(client, articles)

    enrichment_map = {e["id"]: e for e in enrichments}
    for article in articles:
        enrichment = enrichment_map.get(article["id"], {})
        article["category"] = enrichment.get("category", article.get("category", "台股"))
        article["stocks"] = enrichment.get("stocks", article.get("stocks", []))
        article["summary"] = enrichment.get("summary", article.get("summary", ""))

    # Save enriched articles
    year, month, day = date_str.split("-")
    out_dir = Path(__file__).parent.parent / "data" / year / month / day
    with open(out_dir / "articles.json", "w", encoding="utf-8") as f:
        json.dump({"date": date_str, "articles": articles}, f, ensure_ascii=False, indent=2)
    print(f"Saved enriched articles")

    # Step 2: Generate daily summary
    print("Generating daily summary...")
    summary = generate_daily_summary(client, articles)
    summary["date"] = date_str

    with open(out_dir / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"Saved daily summary")

    print("Done!")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Verify with API key**

```bash
cd "/mnt/d/Tommy/Financial News Report"
export ANTHROPIC_API_KEY="your-key-here"
python scripts/generate_summary.py
```

Expected: Script reads `articles.json`, categorizes each article, generates daily summary, saves updated `articles.json` and `summary.json`.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate_summary.py
git commit -m "feat: add AI summary generation script with Claude API"
```

---

### Task 9: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-news.yml`

- [ ] **Step 1: Create workflow file**

Create `.github/workflows/daily-news.yml`:

```yaml
name: Daily Financial News Update

on:
  schedule:
    # Run at 00:00 UTC (08:00 Taiwan time), weekdays only
    - cron: "0 0 * * 1-5"
  workflow_dispatch: # Allow manual trigger

permissions:
  contents: write

jobs:
  update-news:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"
          cache-dependency-path: scripts/requirements.txt

      - name: Install Python dependencies
        run: pip install -r scripts/requirements.txt

      - name: Collect news
        run: python scripts/collect_news.py

      - name: Fetch market data
        run: python scripts/fetch_market_data.py

      - name: Generate AI summary
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python scripts/generate_summary.py

      - name: Commit and push data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          DATE=$(TZ='Asia/Taipei' date +%Y-%m-%d)
          git add data/
          git diff --cached --quiet || git commit -m "chore: daily news update ${DATE}"
          git push
```

- [ ] **Step 2: Verify workflow syntax**

```bash
cd "/mnt/d/Tommy/Financial News Report"
cat .github/workflows/daily-news.yml | python -c "import sys, yaml; yaml.safe_load(sys.stdin); print('Valid YAML')"
```

If `pyyaml` is not installed, install it first: `pip install pyyaml`

Expected: "Valid YAML"

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Actions daily news workflow"
```

---

### Task 10: Polish, SEO, and Production Readiness

**Files:**
- Modify: `src/app/layout.tsx` (metadata, OG tags)
- Modify: `src/app/page.tsx` (empty state)
- Create: `.gitignore` additions
- Modify: `next.config.ts`

- [ ] **Step 1: Enhance metadata and OG tags**

Update `src/app/layout.tsx` metadata:

```tsx
export const metadata: Metadata = {
  title: {
    default: "每日財經新聞",
    template: "%s — 每日財經新聞",
  },
  description: "AI 驅動的每日台股財經新聞自動整理，每日更新台股、國際、產業、政策新聞摘要。",
  openGraph: {
    title: "每日財經新聞",
    description: "AI 驅動的每日台股財經新聞自動整理",
    type: "website",
    locale: "zh_TW",
  },
};
```

- [ ] **Step 2: Update .gitignore**

Add to `.gitignore`:

```
.superpowers/
__pycache__/
*.pyc
.env
```

- [ ] **Step 3: Verify full build**

```bash
cd "/mnt/d/Tommy/Financial News Report"
npm run build
```

Expected: Build succeeds with no errors. All pages generated.

- [ ] **Step 4: Commit**

```bash
git add .gitignore src/app/layout.tsx next.config.ts
git commit -m "feat: add SEO metadata, OG tags, and production config"
```

- [ ] **Step 5: Create GitHub repository and push**

```bash
# Create new GitHub repo (requires gh CLI to be authenticated)
gh repo create financial-news-report --public --source=. --remote=origin
git push -u origin main
```

- [ ] **Step 6: Set up Vercel and GitHub Secrets**

Manual steps:
1. Go to https://vercel.com, import the `financial-news-report` GitHub repo
2. Vercel auto-detects Next.js — use default settings
3. Go to GitHub repo → Settings → Secrets → Actions → Add `ANTHROPIC_API_KEY`
4. Manually trigger the workflow: Actions → Daily Financial News Update → Run workflow

- [ ] **Step 7: Verify end-to-end**

1. Trigger GitHub Action manually
2. Check that Action completes successfully
3. Check that data/ files are committed
4. Check that Vercel auto-deploys
5. Visit the live site and verify all pages render correctly
