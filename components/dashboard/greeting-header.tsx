// ============================================================
// FILE (NUOVO): components/dashboard/greeting-header.tsx
// Saluto + data/ora calcolati lato client (fuso orario dell'utente)
// ============================================================

"use client";

import { useEffect, useState } from "react";

export function GreetingHeader({ firstName }: { firstName: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const greeting = now ? getGreeting(now.getHours()) : "Ciao";
  const dateLabel = now ? formatDate(now) : "";
  const timeLabel = now ? formatTime(now) : "";

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
        {greeting}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-muted-foreground text-sm md:text-base">
        {dateLabel}
        {timeLabel && <span className="ml-2 text-slate-400">· {timeLabel}</span>}
      </p>
    </div>
  );
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 13) return "Buongiorno";
  if (hour >= 13 && hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function formatDate(date: Date): string {
  const label = date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}