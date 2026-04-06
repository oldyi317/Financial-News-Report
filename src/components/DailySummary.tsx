import type { DailySummary as DailySummaryType } from "@/lib/types";

export default function DailySummary({ summary }: { summary: DailySummaryType }) {
  return (
    <section className="bg-surface border-l-4 border-primary rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-3">今日重點摘要</h2>
      <p className="text-text-secondary leading-relaxed mb-4">{summary.overview}</p>
      <ul className="space-y-2">
        {summary.highlights.map((highlight, i) => (
          <li key={i} className="flex items-start gap-2 text-text-secondary">
            <span className="text-primary mt-1">•</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
