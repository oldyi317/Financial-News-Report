# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev          # Local dev server with hot reload
npm run build        # Production build (SSG, generates all static pages)
npm run lint         # ESLint check
npm start            # Serve production build

# Python data pipeline
pip install -r scripts/requirements.txt
python scripts/collect_news.py         # Collect news from RSS/scraping
python scripts/fetch_market_data.py    # Fetch TAIEX data from TWSE
ANTHROPIC_API_KEY=... python scripts/generate_summary.py  # AI categorization + summary
```

## Architecture

This is a daily Taiwan stock market news aggregation website. Two independent systems produce a static site:

**Python data pipeline** (runs daily via GitHub Actions at 08:00 Taiwan time):
1. `collect_news.py` — fetches from RSS feeds (鉅亨網, 經濟日報, MoneyDJ, Google News) and scrapes Yahoo Finance TW, deduplicates by title similarity
2. `fetch_market_data.py` — fetches TAIEX index and top movers from TWSE API
3. `generate_summary.py` — calls Claude API (claude-haiku-4-5-20251001) to categorize articles (台股/國際/產業/政策), extract stock codes, generate per-article summaries and a daily overview

Output: JSON files in `data/YYYY/MM/DD/` (articles.json, summary.json, market.json). These are committed to git; the push triggers Vercel to redeploy.

**Next.js 16 SSG frontend** reads JSON at build time via `src/lib/data.ts` (synchronous `fs.readFileSync`). All dynamic routes use `generateStaticParams()` to pre-render pages. No database, no API routes.

## Key Technical Details

- **Tailwind CSS v4**: Theme colors defined via `@theme inline` in `globals.css`, NOT in `tailwind.config.ts`. Custom colors: `primary` (#3b82f6), `background` (#0a0a0a), `surface` (#111111), `border` (#333333).
- **Next.js 15+ async params**: Dynamic route params are Promises. Use `const { date } = await params` pattern.
- **Data format**: `getDailyArticles()` handles both `{ date, articles: [...] }` and raw array formats (Python scripts produce the former, some edge cases produce the latter).
- **Client components**: Only `CategoryTabs.tsx` and `Calendar.tsx` use `"use client"` — everything else is server-rendered.
- **Categories**: 台股, 國際, 產業, 政策. URL slugs: taiwan-stock, international, industry, policy.
- **All UI text is Traditional Chinese (zh-TW)**.

## Data Types

Core interfaces in `src/lib/types.ts`: `Article`, `ArticlesData`, `DailySummary`, `MarketData`, `MarketIndex`, `StockMover`. The `Article.stocks` field contains Taiwan stock codes as strings (e.g., "2330").
