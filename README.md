# 📊 每日財經新聞

AI 驅動的每日台股財經新聞自動整理網站，每日自動收集、分類、摘要台灣股市相關新聞。

🔗 **線上版本**：[financial-news-report.vercel.app](https://financial-news-report.vercel.app)

## 功能

- **每日新聞彙整** — 自動收集多個來源的財經新聞，AI 分類並產生摘要
- **分類瀏覽** — 台股、國際、產業、政策四大分類
- **個股追蹤** — 依股票代號查看相關新聞
- **大盤走勢圖** — 首頁顯示加權指數歷史走勢
- **週報 / 月報** — 彙整多日資料的統計與摘要
- **全文搜尋** — 依關鍵字搜尋歷史文章
- **RSS 訂閱** — `/feed.xml` 供 RSS 閱讀器訂閱
- **深色 / 淺色模式** — 支援主題切換

## 架構

```
┌─────────────────┐     ┌──────────────┐     ┌────────────┐
│  Python 資料管線  │ ──▶ │  data/ (JSON) │ ──▶ │  Next.js SSG │
│  (GitHub Actions) │     │  (git commit) │     │  (Vercel)    │
└─────────────────┘     └──────────────┘     └────────────┘
```

**Python 資料管線**（每日 08:00 台灣時間自動執行）：

1. `collect_news.py` — 從 RSS / 網頁爬取新聞（鉅亨網、經濟日報、MoneyDJ、工商時報、自由財經、Yahoo 奇摩股市、Google News）
2. `fetch_market_data.py` — 從 TWSE API 取得加權指數與個股漲跌
3. `generate_summary.py` — 呼叫 Claude API 進行分類、摘要、股票代號提取

**Next.js 16 SSG 前端**：Build 時讀取 JSON 產生靜態頁面，無資料庫、無 API。

## 快速開始

### 前端

```bash
npm install
npm run dev          # 開發模式 http://localhost:3000
npm run build        # 產生靜態網站
```

### 資料管線

```bash
pip install -r scripts/requirements.txt

python scripts/collect_news.py                            # 收集新聞
python scripts/fetch_market_data.py                       # 抓取市場數據
ANTHROPIC_API_KEY=sk-... python scripts/generate_summary.py  # AI 分類與摘要
```

## 部署

1. 將 repo 推送到 GitHub
2. 連結 Vercel 自動部署
3. 在 GitHub repo 設定中加入 Secret：`ANTHROPIC_API_KEY`
4. GitHub Actions 每週一至週五 08:00（台灣時間）自動執行資料管線，push 後觸發 Vercel 重新部署

## 技術棧

- **前端**：Next.js 16、React 19、Tailwind CSS v4、TypeScript
- **資料管線**：Python 3.11、feedparser、BeautifulSoup、Anthropic SDK
- **AI**：Claude claude-haiku-4-5-20251001（文章分類與摘要）
- **部署**：Vercel（前端）、GitHub Actions（資料管線）

## 資料格式

每日資料存放於 `data/YYYY/MM/DD/`：

| 檔案 | 說明 |
|------|------|
| `articles.json` | 新聞文章列表（標題、來源、分類、股票代號、摘要） |
| `summary.json` | 每日重點摘要與分類摘要 |
| `market.json` | 加權指數、成交量、個股漲跌幅 |

## 授權

MIT
