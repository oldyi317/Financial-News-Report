#!/usr/bin/env python3
"""Generate AI summaries for financial news using Claude API."""

import json
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import anthropic

TW_TZ = timezone(timedelta(hours=8))

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MODEL = "claude-haiku-4-5-20251001"

CATEGORIZE_PROMPT = """你是一位台灣財經新聞分類專家。請為以下新聞分類並提取資訊。

對於每則新聞，請回傳：
1. category: 分類為其中一個：台股、國際、產業、政策
2. stocks: 新聞中提到的台股股票代號列表（如 2330、2454），沒有則為空陣列
3. summary: 50-80字的中文摘要

請以 JSON 陣列格式回覆，每個元素包含 id, category, stocks, summary。
僅回傳 JSON，不要其他文字。

新聞列表：
{articles_text}"""

DAILY_SUMMARY_PROMPT = """你是一位台灣財經新聞分析師。根據以下今日新聞，產生每日財經摘要。

請回傳 JSON 格式：
{{
  "overview": "200-300字的今日財經總覽",
  "highlights": ["重點1", "重點2", ...],
  "categorySummaries": {{
    "台股": "100-150字台股摘要",
    "國際": "100-150字國際摘要",
    "產業": "100-150字產業摘要",
    "政策": "100-150字政策摘要"
  }}
}}

僅回傳 JSON，不要其他文字。

今日新聞：
{articles_text}"""


def _now_tw():
    return datetime.now(TW_TZ)


def _parse_json_response(text):
    """Parse JSON from API response, stripping markdown code fences if present."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def load_articles(date_str):
    """Load articles from Supabase for a given date.

    Args:
        date_str: Date string in YYYY-MM-DD format.

    Returns:
        List of article dicts, or empty list if none found.
    """
    from db import get_client

    supabase = get_client()
    result = supabase.table("articles").select("*").eq("date", date_str).execute()
    articles = []
    for row in result.data:
        articles.append({
            "id": row["id"],
            "title": row["title"],
            "source": row["source"],
            "sourceUrl": row["source_url"],
            "category": row.get("category", ""),
            "stocks": row.get("stocks", []),
            "summary": row.get("summary", ""),
            "publishedAt": row["published_at"],
        })
    print(f"Loaded {len(articles)} articles from Supabase")
    return articles


def categorize_articles(client, articles):
    """Use Claude API to categorize articles and extract information.

    Processes articles in batches of 10.

    Args:
        client: anthropic.Anthropic client instance.
        articles: List of article dicts.

    Returns:
        List of enrichment dicts with id, category, stocks, summary.
    """
    results = []
    batch_size = 10

    for i in range(0, len(articles), batch_size):
        batch = articles[i : i + batch_size]
        print(f"Categorizing batch {i // batch_size + 1} ({len(batch)} articles)...")

        articles_text = "\n".join(
            f"[ID: {a['id']}] {a.get('title', '')} - {a.get('source', '')}\n"
            f"  {a.get('content', a.get('description', ''))[:300]}"
            for a in batch
        )

        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                messages=[
                    {
                        "role": "user",
                        "content": CATEGORIZE_PROMPT.format(
                            articles_text=articles_text
                        ),
                    }
                ],
            )
            parsed = _parse_json_response(response.content[0].text)
            results.extend(parsed)
            print(f"  Successfully categorized {len(parsed)} articles.")
        except Exception as e:
            print(f"  API error: {e}. Using defaults for this batch.")
            for a in batch:
                results.append(
                    {
                        "id": a["id"],
                        "category": "台股",
                        "stocks": [],
                        "summary": a.get("title", "")[:80],
                    }
                )

    return results


def generate_daily_summary(client, articles):
    """Use Claude API to generate a daily financial summary.

    Args:
        client: anthropic.Anthropic client instance.
        articles: List of article dicts.

    Returns:
        Dict matching summary.json schema with overview, highlights,
        categorySummaries.
    """
    articles_text = "\n".join(
        f"[{a.get('category', '台股')}] {a.get('title', '')}\n"
        f"  {a.get('summary', a.get('description', ''))[:200]}"
        for a in articles
    )

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": DAILY_SUMMARY_PROMPT.format(
                        articles_text=articles_text
                    ),
                }
            ],
        )
        result = _parse_json_response(response.content[0].text)
        print("Daily summary generated successfully.")
        return result
    except Exception as e:
        print(f"API error generating daily summary: {e}. Using fallback.")
        return {
            "overview": "今日財經新聞摘要暫時無法生成。",
            "highlights": [],
            "categorySummaries": {
                "台股": "",
                "國際": "",
                "產業": "",
                "政策": "",
            },
        }


def main():
    """Entry point: enrich articles and generate daily summary."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable is not set.")
        return

    client = anthropic.Anthropic(api_key=api_key)

    today = _now_tw()
    date_str = today.strftime("%Y-%m-%d")
    print(f"Processing date: {date_str}")

    # Load articles
    articles = load_articles(date_str)
    if not articles:
        print("No articles to process. Exiting.")
        return

    # Categorize and enrich articles
    print("Starting article categorization...")
    enrichments = categorize_articles(client, articles)

    from db import get_client

    enrichment_map = {e["id"]: e for e in enrichments}
    for article in articles:
        aid = article["id"]
        if aid in enrichment_map:
            article["category"] = enrichment_map[aid].get("category", "台股")
            article["stocks"] = enrichment_map[aid].get("stocks", [])
            article["summary"] = enrichment_map[aid].get("summary", "")

    # Update articles in Supabase with enriched data
    supabase = get_client()
    for article in articles:
        supabase.table("articles").update({
            "category": article["category"],
            "stocks": article["stocks"],
            "summary": article["summary"],
        }).eq("id", article["id"]).execute()
    print(f"Updated {len(articles)} articles in Supabase")

    # Generate daily summary
    print("Generating daily summary...")
    summary = generate_daily_summary(client, articles)

    summary_row = {
        "date": date_str,
        "overview": summary.get("overview", ""),
        "highlights": summary.get("highlights", []),
        "category_summaries": json.dumps(summary.get("categorySummaries", {}), ensure_ascii=False),
    }

    supabase.table("daily_summaries").upsert(summary_row, on_conflict="date").execute()
    print(f"Daily summary saved to Supabase")


if __name__ == "__main__":
    main()
