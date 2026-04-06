import { TrendingUp, TrendingDown } from "lucide-react";
import type { MarketData } from "@/lib/types";

function formatVolume(volume: number): string {
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(0)}億`;
  }
  return volume.toLocaleString();
}

function ChangeText({ change, changePercent }: { change: number; changePercent: number }) {
  const isPositive = change >= 0;
  const color = isPositive ? "text-positive" : "text-negative";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={`${color} inline-flex items-center gap-1`}>
      <Icon size={14} />
      <span className="font-mono-num">
        {Math.abs(change).toFixed(change % 1 === 0 ? 0 : 2)} ({Math.abs(changePercent).toFixed(2)}%)
      </span>
    </span>
  );
}

export default function MarketIndicators({ market }: { market: MarketData }) {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-text-muted mb-1">加權指數</div>
          <div className="text-xl font-bold font-mono-num">{market.taiex.close.toLocaleString()}</div>
          <ChangeText change={market.taiex.change} changePercent={market.taiex.changePercent} />
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-text-muted mb-1">成交量</div>
          <div className="text-xl font-bold font-mono-num">{formatVolume(market.taiex.volume)}</div>
        </div>
        {market.topMovers.slice(0, 2).map((stock) => (
          <div key={stock.code} className="bg-surface rounded-lg p-4 border border-border">
            <div className="text-sm text-text-muted mb-1">{stock.code} {stock.name}</div>
            <div className="text-xl font-bold font-mono-num">{stock.close}</div>
            <ChangeText change={stock.change} changePercent={stock.changePercent} />
          </div>
        ))}
      </div>
    </section>
  );
}
