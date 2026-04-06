#!/usr/bin/env python3
"""Fetch TAIEX index and top stock movers from TWSE."""

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

TW_TZ = timezone(timedelta(hours=8))

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

TWSE_MI_INDEX_URL = "https://www.twse.com.tw/exchangeReport/MI_INDEX"

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _now_tw():
    return datetime.now(TW_TZ)


def _today_str():
    return _now_tw().strftime("%Y%m%d")


def _parse_number(s):
    """Parse a number string that may contain commas or signs."""
    if not s:
        return 0.0
    s = str(s).replace(",", "").replace("+", "").strip()
    try:
        return float(s)
    except ValueError:
        return 0.0


# ------------------------------------------------------------------
# 1. Fetch TAIEX
# ------------------------------------------------------------------

def fetch_taiex():
    """Fetch TAIEX index data from TWSE API."""
    result = {"close": 0, "change": 0, "changePercent": 0, "volume": 0}
    try:
        print("  Fetching TAIEX index ...")
        resp = requests.get(
            TWSE_MI_INDEX_URL,
            params={"response": "json", "type": "IND", "date": _today_str()},
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        # The TWSE API returns index data in data1 or data8 depending
        # on the response format.  We look for the row whose first
        # element contains "加權" (TAIEX).
        for key in ("data1", "data8", "data"):
            rows = data.get(key)
            if not rows:
                continue
            for row in rows:
                if "加權" in str(row[0]):
                    result["close"] = _parse_number(row[1]) if len(row) > 1 else 0
                    result["change"] = _parse_number(row[2]) if len(row) > 2 else 0
                    close = result["close"]
                    change = result["change"]
                    if close and close != change:
                        result["changePercent"] = round(
                            change / (close - change) * 100, 2
                        )
                    print(f"    TAIEX: {result['close']} ({result['change']:+})")
                    return result

        # Also try the 'groups' structure some API versions return
        print("    [INFO] Could not locate TAIEX row in response")
    except Exception as exc:
        print(f"    [WARN] Failed to fetch TAIEX: {exc}")

    return result


# ------------------------------------------------------------------
# 2. Fetch top movers
# ------------------------------------------------------------------

def fetch_top_movers(limit=20):
    """Fetch top stock movers from TWSE (ALLBUT0999 = all listed stocks)."""
    movers = []
    try:
        print("  Fetching top movers ...")
        resp = requests.get(
            TWSE_MI_INDEX_URL,
            params={"response": "json", "type": "ALLBUT0999", "date": _today_str()},
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        # data9 typically contains individual stock rows:
        # [code, name, volume, ..., close, change, ...]
        rows = data.get("data9") or data.get("data8") or data.get("data") or []
        if not rows:
            print("    [INFO] No stock data rows found (market may be closed)")
            return movers

        scored = []
        for row in rows:
            try:
                code = str(row[0]).strip()
                name = str(row[1]).strip()
                close = _parse_number(row[8]) if len(row) > 8 else 0
                raw_change = str(row[9]).strip() if len(row) > 9 else ""
                change_val = _parse_number(row[10]) if len(row) > 10 else 0

                # Determine sign from the direction indicator
                if "<p" in raw_change.lower() or "-" in raw_change:
                    change_val = -abs(change_val)

                change_pct = 0
                if close and close != change_val:
                    change_pct = round(change_val / (close - change_val) * 100, 2)

                scored.append({
                    "code": code,
                    "name": name,
                    "close": close,
                    "change": change_val,
                    "changePercent": change_pct,
                })
            except Exception:
                continue

        # Sort by absolute change percent descending
        scored.sort(key=lambda x: abs(x["changePercent"]), reverse=True)
        movers = scored[:limit]
        print(f"    -> got {len(movers)} top movers")
    except Exception as exc:
        print(f"    [WARN] Failed to fetch top movers: {exc}")

    return movers


# ------------------------------------------------------------------
# 3. Save
# ------------------------------------------------------------------

def save_market_data(date_str=None):
    """Save market data to data/YYYY/MM/DD/market.json."""
    if date_str is None:
        now = _now_tw()
        date_str = now.strftime("%Y/%m/%d")

    taiex = fetch_taiex()
    top_movers = fetch_top_movers()

    market = {
        "date": date_str.replace("/", "-"),
        "taiex": taiex,
        "topMovers": top_movers,
    }

    parts = date_str.split("/")
    out_dir = PROJECT_ROOT / "data" / parts[0] / parts[1] / parts[2]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "market.json"

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(market, f, ensure_ascii=False, indent=2)

    print(f"\nSaved market data -> {out_path}")
    return str(out_path)


# ------------------------------------------------------------------
# 4. Main
# ------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Market Data Fetcher")
    print(f"Time (TW): {_now_tw().isoformat()}")
    print("=" * 60 + "\n")

    path = save_market_data()
    print(f"\nDone. Output: {path}")


if __name__ == "__main__":
    main()
