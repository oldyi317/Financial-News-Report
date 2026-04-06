#!/usr/bin/env python3
"""Migrate existing JSON data files to Supabase."""

import json
import os
from pathlib import Path

from db import get_client

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"


def migrate():
    supabase = get_client()

    if not DATA_DIR.exists():
        print("No data directory found.")
        return

    # Scan all date directories
    for year_dir in sorted(DATA_DIR.iterdir()):
        if not year_dir.is_dir() or not year_dir.name.isdigit():
            continue
        for month_dir in sorted(year_dir.iterdir()):
            if not month_dir.is_dir() or not month_dir.name.isdigit():
                continue
            for day_dir in sorted(month_dir.iterdir()):
                if not day_dir.is_dir() or not day_dir.name.isdigit():
                    continue

                date_str = f"{year_dir.name}-{month_dir.name}-{day_dir.name}"
                print(f"\n--- Migrating {date_str} ---")

                # Articles
                articles_path = day_dir / "articles.json"
                if articles_path.exists():
                    with open(articles_path, "r", encoding="utf-8") as f:
                        articles = json.load(f)
                    # Handle both list and {date, articles} formats
                    if isinstance(articles, dict):
                        articles = articles.get("articles", [])

                    rows = []
                    for art in articles:
                        rows.append({
                            "id": art["id"],
                            "date": date_str,
                            "title": art["title"],
                            "source": art.get("source", ""),
                            "source_url": art.get("sourceUrl", ""),
                            "category": art.get("category", ""),
                            "stocks": art.get("stocks", []),
                            "summary": art.get("summary", ""),
                            "published_at": art.get("publishedAt", f"{date_str}T00:00:00+08:00"),
                        })

                    if rows:
                        supabase.table("articles").upsert(rows, on_conflict="id").execute()
                        print(f"  Articles: {len(rows)} migrated")

                # Summary
                summary_path = day_dir / "summary.json"
                if summary_path.exists():
                    with open(summary_path, "r", encoding="utf-8") as f:
                        summary = json.load(f)

                    row = {
                        "date": date_str,
                        "overview": summary.get("overview", ""),
                        "highlights": summary.get("highlights", []),
                        "category_summaries": json.dumps(
                            summary.get("categorySummaries", {}), ensure_ascii=False
                        ),
                    }
                    supabase.table("daily_summaries").upsert(row, on_conflict="date").execute()
                    print(f"  Summary: migrated")

                # Market
                market_path = day_dir / "market.json"
                if market_path.exists():
                    with open(market_path, "r", encoding="utf-8") as f:
                        market = json.load(f)

                    taiex = market.get("taiex", {})
                    row = {
                        "date": date_str,
                        "taiex_close": taiex.get("close", 0),
                        "taiex_change": taiex.get("change", 0),
                        "taiex_change_percent": taiex.get("changePercent", 0),
                        "taiex_volume": int(taiex.get("volume", 0)),
                        "top_movers": json.dumps(
                            market.get("topMovers", []), ensure_ascii=False
                        ),
                    }
                    supabase.table("market_data").upsert(row, on_conflict="date").execute()
                    print(f"  Market: migrated")

    print("\n✓ Migration complete!")


if __name__ == "__main__":
    migrate()
