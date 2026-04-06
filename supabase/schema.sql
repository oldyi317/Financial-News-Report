-- =============================================
-- 每日財經新聞 - Supabase Schema
-- =============================================

-- 1. 新聞文章
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  stocks TEXT[] DEFAULT '{}',
  summary TEXT DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_date ON articles (date DESC);
CREATE INDEX idx_articles_category ON articles (category);
CREATE INDEX idx_articles_stocks ON articles USING GIN (stocks);
CREATE INDEX idx_articles_title_search ON articles USING GIN (to_tsvector('simple', title || ' ' || summary));

-- 2. 每日摘要
CREATE TABLE daily_summaries (
  date DATE PRIMARY KEY,
  overview TEXT NOT NULL,
  highlights TEXT[] DEFAULT '{}',
  category_summaries JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 市場數據
CREATE TABLE market_data (
  date DATE PRIMARY KEY,
  taiex_close NUMERIC NOT NULL,
  taiex_change NUMERIC NOT NULL,
  taiex_change_percent NUMERIC NOT NULL,
  taiex_volume BIGINT NOT NULL,
  top_movers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- 允許公開讀取
CREATE POLICY "Public read access" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON daily_summaries FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_data FOR SELECT USING (true);

-- 只允許 service_role 寫入（Python 腳本用）
CREATE POLICY "Service role insert" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON articles FOR UPDATE USING (true);
CREATE POLICY "Service role insert" ON daily_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON daily_summaries FOR UPDATE USING (true);
CREATE POLICY "Service role insert" ON market_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON market_data FOR UPDATE USING (true);
