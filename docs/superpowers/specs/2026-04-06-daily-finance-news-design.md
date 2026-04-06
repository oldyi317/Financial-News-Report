# 每日財經新聞整理網站 — 設計規格

## 概述

一個全自動化的個人每日台股財經新聞整理網站，透過爬蟲 + API 收集新聞、AI 產生摘要與分類，以靜態網站形式公開部署。

## 系統架構

**架構：Next.js SSG + GitHub Actions + Vercel**

```
GitHub Actions (每日排程 08:00 UTC+8)
  → Python 爬蟲/RSS 收集新聞
  → Claude API 產生摘要與分類
  → 產生 JSON 檔 → git commit & push
  → Vercel 偵測 push → 自動重新部署 Next.js SSG 靜態網站
```

### 為什麼選擇這個架構
- 完全免費（GitHub Actions + Vercel 免費額度）
- 無伺服器、無資料庫，維護成本最低
- Python 生態適合爬蟲與 AI 處理
- SSG 靜態網站載入快、SEO 友好

## 資料來源

| 來源 | 方式 | 內容 |
|------|------|------|
| 鉅亨網 | RSS Feed | 台股、國際財經新聞 |
| 經濟日報 | RSS Feed | 台灣經濟、產業新聞 |
| Yahoo 奇摩股市 | 爬蟲 | 台股個股新聞、大盤數據 |
| MoneyDJ | RSS Feed | 台股研究報告、產業分析 |
| Google News | RSS (財經分類) | 綜合財經新聞備用來源 |

## 資料處理流程

1. **收集**：Python 爬蟲/RSS 取得 30-50 則原始新聞
2. **去重**：依標題相似度去除重複新聞
3. **分類**：AI 自動分類為「台股」「國際」「產業」「政策」
4. **個股標記**：AI 辨識新聞中提到的股票代號/名稱
5. **摘要產生**：
   - 每日總覽（200-300 字）：今日最重要的 3-5 件事
   - 分類摘要（每類 100-150 字）：各分類重點
   - 個別新聞摘要（每則 50-80 字）

## 資料結構

```
data/
  └── 2026/
      └── 04/
          └── 06/
              ├── summary.json      # 每日總覽摘要
              ├── articles.json     # 所有新聞（含分類、個股標記、摘要）
              └── market.json       # 大盤數據（加權指數、成交量等）
```

### articles.json 結構
```json
{
  "date": "2026-04-06",
  "articles": [
    {
      "id": "uuid",
      "title": "台積電法說超預期",
      "source": "鉅亨網",
      "sourceUrl": "https://...",
      "category": "台股",
      "stocks": ["2330"],
      "summary": "台積電Q1營收超出市場預期...",
      "publishedAt": "2026-04-06T08:30:00+08:00"
    }
  ]
}
```

### summary.json 結構
```json
{
  "date": "2026-04-06",
  "overview": "今日台股在外資回補帶動下收漲...",
  "highlights": [
    "台積電法說超預期，帶動半導體族群上漲",
    "Fed 維持利率不變，美股反應平淡"
  ],
  "categorySummaries": {
    "台股": "台股加權指數收漲 150 點...",
    "國際": "美股三大指數小幅震盪...",
    "產業": "AI 相關族群持續受關注...",
    "政策": "金管會宣布新規..."
  }
}
```

### market.json 結構
```json
{
  "date": "2026-04-06",
  "taiex": { "close": 22150, "change": 150, "changePercent": 0.68, "volume": 325000000000 },
  "topMovers": [
    { "code": "2330", "name": "台積電", "close": 890, "change": 15, "changePercent": 1.71 }
  ]
}
```

## 網站頁面

### 技術棧
- **框架**：Next.js 15 App Router + TypeScript
- **樣式**：Tailwind CSS（深色主題）
- **渲染**：SSG (Static Site Generation)
- **字型**：Noto Sans TC
- **部署**：Vercel

### UI 風格
- 深色主題（#0a0a0a 背景）
- 藍色系強調色（#3b82f6）
- 乾淨、專注的新聞入口型佈局
- 響應式設計（手機/平板/桌面）

### 頁面規劃

| 頁面 | 路徑 | 說明 |
|------|------|------|
| 首頁 | `/` | 今日摘要 + 大盤指標 + 分類入口 |
| 每日報告 | `/daily/[date]` | 特定日期的完整新聞報告 |
| 分類頁 | `/category/[slug]` | 台股/國際/產業/政策 分類新聞列表 |
| 個股頁 | `/stock/[code]` | 特定股票的相關新聞彙整 |
| 歷史頁 | `/archive` | 日曆式瀏覽過去的每日報告 |

### 首頁區塊（由上到下）
1. **Header**：網站名稱 + 日期
2. **每日摘要卡片**：AI 整理的今日重點（帶藍色左邊框）
3. **大盤指標**：加權指數、成交量、漲跌幅（卡片式）
4. **分類新聞**：按「台股/國際/產業/政策」分頁顯示新聞列表
5. **熱門個股**：今日被最多新聞提到的股票
6. **Footer**：資料來源說明、更新時間

## 自動化流程

### GitHub Actions Workflow
- **觸發時間**：每天 00:00 UTC（台灣時間 08:00）
- **步驟**：
  1. Checkout repo
  2. Setup Python 環境
  3. 安裝依賴 (requirements.txt)
  4. 執行爬蟲腳本 (`scripts/collect_news.py`)
  5. 執行 AI 摘要腳本 (`scripts/generate_summary.py`)
  6. Commit & push JSON 資料檔
  7. Vercel 自動偵測 push 並重新部署

### 環境變數（GitHub Secrets）
- `ANTHROPIC_API_KEY`：Claude API 金鑰

## 專案目錄結構

```
Financial News Report/
├── scripts/                    # Python 資料處理腳本
│   ├── collect_news.py         # 爬蟲/RSS 收集新聞
│   ├── generate_summary.py     # AI 摘要產生
│   ├── fetch_market_data.py    # 大盤數據取得
│   └── requirements.txt        # Python 依賴
├── data/                       # 每日新聞資料 (JSON)
│   └── 2026/04/06/
│       ├── summary.json
│       ├── articles.json
│       └── market.json
├── src/                        # Next.js 前端
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # 首頁
│   │   ├── daily/[date]/
│   │   │   └── page.tsx        # 每日報告
│   │   ├── category/[slug]/
│   │   │   └── page.tsx        # 分類頁
│   │   ├── stock/[code]/
│   │   │   └── page.tsx        # 個股頁
│   │   └── archive/
│   │       └── page.tsx        # 歷史頁
│   ├── components/
│   │   ├── DailySummary.tsx     # 每日摘要元件
│   │   ├── MarketIndicators.tsx # 大盤指標元件
│   │   ├── ArticleList.tsx     # 新聞列表元件
│   │   ├── ArticleCard.tsx     # 新聞卡片元件
│   │   ├── CategoryTabs.tsx    # 分類標籤元件
│   │   ├── StockBadge.tsx      # 個股標籤元件
│   │   └── Calendar.tsx        # 歷史日曆元件
│   └── lib/
│       └── data.ts             # 資料讀取工具函式
├── .github/
│   └── workflows/
│       └── daily-news.yml      # GitHub Actions 排程
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 驗證方式

1. **Python 腳本**：手動執行 `python scripts/collect_news.py` 確認能取得新聞
2. **AI 摘要**：手動執行 `python scripts/generate_summary.py` 確認摘要品質
3. **前端**：`npm run dev` 本地預覽，確認各頁面渲染正確
4. **SSG 建置**：`npm run build` 確認靜態產生無錯誤
5. **端對端**：模擬完整流程（收集 → 摘要 → 建置 → 預覽）
6. **GitHub Actions**：推送後確認 workflow 正確執行
