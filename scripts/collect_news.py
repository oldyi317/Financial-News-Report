#!/usr/bin/env python3
"""Collect financial news from RSS feeds and Yahoo Finance Taiwan."""

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

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

RSS_SOURCES = {
    "鉅亨網": [
        "https://news.cnyes.com/news/cat/tw_stock/rss",
        "https://news.cnyes.com/news/cat/wd_stock/rss",
        "https://news.cnyes.com/news/cat/fund/rss",
    ],
    "經濟日報": [
        "https://money.udn.com/rssfeed/news/1001/5710",
        "https://money.udn.com/rssfeed/news/1001/5607",
        "https://money.udn.com/rssfeed/news/1001/12017",
    ],
    "MoneyDJ": [
        "https://www.moneydj.com/rss/rsscontent.aspx?svc=NW&fno=1",
        "https://www.moneydj.com/rss/rsscontent.aspx?svc=NW&fno=4",
    ],
    "工商時報": [
        "https://ctee.com.tw/feed",
    ],
    "自由財經": [
        "https://ec.ltn.com.tw/rss",
    ],
    "Google News": [
        "https://news.google.com/rss/search?q=台股+when:1d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant",
        "https://news.google.com/rss/search?q=台灣+經濟+when:1d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant",
    ],
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _now_tw():
    """Return current time in Taiwan timezone."""
    return datetime.now(TW_TZ)


def _parse_published(entry):
    """Parse the published date from an RSS entry, fallback to now."""
    for key in ("published_parsed", "updated_parsed"):
        tp = entry.get(key)
        if tp:
            try:
                dt = datetime(*tp[:6], tzinfo=timezone.utc)
                return dt.astimezone(TW_TZ).isoformat()
            except Exception:
                pass
    return _now_tw().isoformat()


def _make_article(title, source, url, summary, published_at):
    """Create a standardised article dict."""
    return {
        "id": str(uuid.uuid4())[:8],
        "title": title.strip(),
        "source": source,
        "sourceUrl": url,
        "category": "",
        "stocks": [],
        "summary": (summary or "")[:200],
        "publishedAt": published_at,
    }


# ------------------------------------------------------------------
# 1. RSS fetching
# ------------------------------------------------------------------

def fetch_rss_articles(source_name, urls):
    """Fetch articles from a list of RSS feed URLs for a given source."""
    articles = []
    for url in urls:
        try:
            print(f"  Fetching RSS: {url}")
            resp = requests.get(
                url, headers={"User-Agent": USER_AGENT}, timeout=15
            )
            feed = feedparser.parse(resp.content)
            for entry in feed.entries:
                title = entry.get("title", "").strip()
                if not title:
                    continue
                articles.append(
                    _make_article(
                        title=title,
                        source=source_name,
                        url=entry.get("link", url),
                        summary=entry.get("summary", ""),
                        published_at=_parse_published(entry),
                    )
                )
            print(f"    -> got {len(feed.entries)} entries")
        except Exception as exc:
            print(f"    [WARN] Failed to fetch {url}: {exc}")
    return articles


# ------------------------------------------------------------------
# 2. Yahoo Finance Taiwan scraping
# ------------------------------------------------------------------

def scrape_yahoo_finance_tw():
    """Scrape headlines from Yahoo Finance Taiwan."""
    url = "https://tw.stock.yahoo.com/news"
    articles = []
    try:
        print(f"  Scraping Yahoo Finance TW: {url}")
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        # Yahoo Finance TW typically renders news items in <a> tags with
        # a headline inside an <h3>.  The exact selectors may change, so
        # we use a broad approach.
        for tag in soup.select("h3 a, a h3"):
            a_tag = tag if tag.name == "a" else tag.parent
            title = tag.get_text(strip=True)
            if not title or len(title) < 5:
                continue
            link = a_tag.get("href", "")
            if link and not link.startswith("http"):
                link = "https://tw.stock.yahoo.com" + link
            articles.append(
                _make_article(
                    title=title,
                    source="Yahoo奇摩股市",
                    url=link,
                    summary="",
                    published_at=_now_tw().isoformat(),
                )
            )
        print(f"    -> got {len(articles)} headlines")
    except Exception as exc:
        print(f"    [WARN] Failed to scrape Yahoo Finance TW: {exc}")
    return articles


# ------------------------------------------------------------------
# 3. Deduplication
# ------------------------------------------------------------------

def deduplicate(articles, threshold=0.7):
    """Remove near-duplicate articles based on title similarity."""
    unique = []
    for art in articles:
        is_dup = False
        for existing in unique:
            ratio = SequenceMatcher(
                None, art["title"], existing["title"]
            ).ratio()
            if ratio >= threshold:
                is_dup = True
                break
        if not is_dup:
            unique.append(art)
    removed = len(articles) - len(unique)
    if removed:
        print(f"  Dedup: removed {removed} duplicates, {len(unique)} remain")
    return unique


# ------------------------------------------------------------------
# 4. Collect all
# ------------------------------------------------------------------

def collect_all():
    """Collect articles from every configured source and deduplicate."""
    all_articles = []

    # RSS sources
    for source_name, urls in RSS_SOURCES.items():
        print(f"[RSS] {source_name}")
        arts = fetch_rss_articles(source_name, urls)
        all_articles.extend(arts)

    # Yahoo Finance TW
    print("[Scrape] Yahoo奇摩股市")
    all_articles.extend(scrape_yahoo_finance_tw())

    print(f"\nTotal before dedup: {len(all_articles)}")
    all_articles = deduplicate(all_articles)
    print(f"Total after dedup:  {len(all_articles)}")

    return all_articles


# ------------------------------------------------------------------
# 5. Save to Supabase
# ------------------------------------------------------------------

def save_articles(articles, date_str=None):
    """Save articles to Supabase."""
    from db import get_client

    if date_str is None:
        now = _now_tw()
        date_str = now.strftime("%Y-%m-%d")

    supabase = get_client()

    rows = []
    for art in articles:
        rows.append({
            "id": art["id"],
            "date": date_str,
            "title": art["title"],
            "source": art["source"],
            "source_url": art["sourceUrl"],
            "category": art.get("category", ""),
            "stocks": art.get("stocks", []),
            "summary": art.get("summary", ""),
            "published_at": art["publishedAt"],
        })

    if rows:
        supabase.table("articles").upsert(rows, on_conflict="id").execute()

    print(f"\nSaved {len(rows)} articles to Supabase (date: {date_str})")
    return date_str


# ------------------------------------------------------------------
# 6. Main
# ------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Financial News Collector")
    print(f"Time (TW): {_now_tw().isoformat()}")
    print("=" * 60 + "\n")

    articles = collect_all()
    date_str = save_articles(articles)
    print(f"\nDone. Date: {date_str}")


if __name__ == "__main__":
    main()
