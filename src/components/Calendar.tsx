"use client";

import { useState } from "react";
import Link from "next/link";

interface CalendarProps {
  availableDates: string[];
}

export default function Calendar({ availableDates }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const dateSet = new Set(availableDates);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  function formatDate(day: number): string {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else { setMonth(month - 1); }
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else { setMonth(month + 1); }
  }

  const monthNames = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-text-secondary hover:text-text-primary transition-colors px-2">←</button>
        <h3 className="text-lg font-bold">{year} {monthNames[month]}</h3>
        <button onClick={nextMonth} className="text-text-secondary hover:text-text-primary transition-colors px-2">→</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["日","一","二","三","四","五","六"].map((d) => (
          <div key={d} className="text-text-muted py-1 font-medium">{d}</div>
        ))}

        {weeks.flat().map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = formatDate(day);
          const hasData = dateSet.has(dateStr);

          if (hasData) {
            return (
              <Link key={dateStr} href={`/daily/${dateStr}`}
                className="py-2 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/40 transition-colors">
                {day}
              </Link>
            );
          }

          return <div key={`day-${i}`} className="py-2 text-text-muted">{day}</div>;
        })}
      </div>
    </div>
  );
}
