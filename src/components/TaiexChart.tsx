import type { MarketData } from "@/lib/types";

interface TaiexChartProps {
  data: MarketData[];
}

export default function TaiexChart({ data }: TaiexChartProps) {
  // data comes newest-first, reverse for chart (left=oldest, right=newest)
  const sorted = [...data].reverse();

  if (sorted.length < 2) {
    return null;
  }

  const closes = sorted.map((d) => d.taiex.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const width = 600;
  const height = 200;
  const padX = 50;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = sorted.map((d, i) => {
    const x = padX + (i / (sorted.length - 1)) * chartW;
    const y = padY + chartH - ((d.taiex.close - min) / range) * chartH;
    return { x, y, date: d.date, close: d.taiex.close, change: d.taiex.change };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const latest = sorted[sorted.length - 1];
  const isUp = latest.taiex.change >= 0;

  // Y-axis labels (3 ticks)
  const yTicks = [min, min + range / 2, max].map((val) => ({
    val: Math.round(val),
    y: padY + chartH - ((val - min) / range) * chartH,
  }));

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">加權指數走勢</h2>
      <div className="bg-surface border border-border rounded-lg p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[300px]">
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick.val}>
              <line
                x1={padX} y1={tick.y} x2={width - padX} y2={tick.y}
                stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4"
              />
              <text x={padX - 8} y={tick.y + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize="11">
                {tick.val.toLocaleString()}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={isUp ? "var(--color-positive-bg)" : "var(--color-negative-bg)"} />

          <path d={linePath} fill="none" stroke={isUp ? "var(--color-positive)" : "var(--color-negative)"} strokeWidth="2" />

          {points.map((p) => (
            <circle key={p.date} cx={p.x} cy={p.y} r="3" fill={isUp ? "var(--color-positive)" : "var(--color-negative)"} />
          ))}

          {/* Date labels */}
          {points.filter((_, i) => i === 0 || i === points.length - 1).map((p) => (
            <text key={p.date} x={p.x} y={height - 2} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">
              {p.date.slice(5)}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
