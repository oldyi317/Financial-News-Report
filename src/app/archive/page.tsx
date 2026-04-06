import Link from "next/link";
import { getAvailableDates, getAvailableWeeks, getAvailableMonths } from "@/lib/data";
import Calendar from "@/components/Calendar";

export const metadata = {
  title: "歷史回顧",
  description: "瀏覽過去的每日財經新聞報告、週報與月報",
};

export default async function ArchivePage() {
  const [dates, weeks, months] = await Promise.all([
    getAvailableDates(),
    getAvailableWeeks(),
    getAvailableMonths(),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">歷史回顧</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {weeks.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">週報</h2>
            <div className="space-y-2">
              {weeks.map((w) => (
                <Link
                  key={w.start}
                  href={`/weekly/${w.start}`}
                  className="cursor-pointer block bg-surface border border-border rounded-lg px-4 py-2 hover:border-primary/50 hover:bg-surface-hover transition-all duration-150 text-sm"
                >
                  <span className="text-primary">{w.label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {months.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">月報</h2>
            <div className="space-y-2">
              {months.map((m) => (
                <Link
                  key={m}
                  href={`/monthly/${m}`}
                  className="cursor-pointer block bg-surface border border-border rounded-lg px-4 py-2 hover:border-primary/50 hover:bg-surface-hover transition-all duration-150 text-sm"
                >
                  <span className="text-primary">{m}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <h2 className="text-lg font-bold mb-3">日曆</h2>
      <p className="text-text-secondary mb-4">點擊有標記的日期查看當天的財經新聞報告</p>
      <div className="max-w-md mx-auto">
        <Calendar availableDates={dates} />
      </div>
    </main>
  );
}
