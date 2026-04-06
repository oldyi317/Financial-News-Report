import { getAvailableDates } from "@/lib/data";
import Calendar from "@/components/Calendar";

export const metadata = {
  title: "歷史回顧 — 每日財經新聞",
  description: "瀏覽過去的每日財經新聞報告",
};

export default function ArchivePage() {
  const dates = getAvailableDates();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">歷史回顧</h1>
      <p className="text-gray-400 mb-6">點擊有標記的日期查看當天的財經新聞報告</p>
      <div className="max-w-md mx-auto">
        <Calendar availableDates={dates} />
      </div>
    </main>
  );
}
