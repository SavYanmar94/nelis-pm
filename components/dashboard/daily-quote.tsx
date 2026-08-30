// ============================================================
// FILE (NUOVO): components/dashboard/daily-quote.tsx
// ============================================================

import { Sparkles } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants/quotes";

export function DailyQuote() {
  const dayOfYear = getDayOfYear(new Date());
  const quote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

  return (
    <div className="rounded-xl bg-gradient-to-r from-[#579bfc]/10 to-[#a25ddc]/10 border border-[#579bfc]/20 px-5 py-4 flex items-start gap-3">
      <Sparkles className="h-5 w-5 text-[#579bfc] shrink-0 mt-0.5" />
      <p className="text-sm font-medium text-slate-700 italic">{quote}</p>
    </div>
  );
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}