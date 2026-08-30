// ============================================================
// FILE (RISCRITTO): lib/utils/gantt.ts
// ============================================================

import type { Task, Project } from "@/lib/types";

export type TaskStatus = "not_scheduled" | "in_progress" | "completed" | "overdue";

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

/** Un task è "in ritardo" se ha una data stimata superata e non è ancora completato */
export function isOverdue(plannedEnd: string | null | undefined): boolean {
  if (!plannedEnd) return false;
  const end = new Date(plannedEnd);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

export function computeTaskStatus(
  task: Pick<Task, "is_scheduled" | "is_completed" | "planned_end">
): TaskStatus {
  if (task.is_completed) return "completed";
  if (isOverdue(task.planned_end)) return "overdue";
  if (task.is_scheduled) return "in_progress";
  return "not_scheduled";
}

/** Stato di gruppo (Micro-Fase): rosso se almeno un task è in ritardo */
export function computeGroupStatus(
  tasks: Pick<Task, "is_scheduled" | "is_completed" | "planned_end">[]
): TaskStatus {
  if (tasks.length === 0) return "not_scheduled";
  if (tasks.some((t) => !t.is_completed && isOverdue(t.planned_end))) return "overdue";
  if (tasks.every((t) => t.is_completed)) return "completed";
  if (tasks.every((t) => t.is_scheduled)) return "in_progress";
  return "not_scheduled";
}

/** Stato di Fase, aggregando gli stati delle sue Micro-Fasi */
export function computeMacroStatus(microStatuses: TaskStatus[]): TaskStatus {
  if (microStatuses.length === 0) return "not_scheduled";
  if (microStatuses.some((s) => s === "overdue")) return "overdue";
  if (microStatuses.every((s) => s === "completed")) return "completed";
  if (microStatuses.some((s) => s === "in_progress" || s === "completed")) return "in_progress";
  return "not_scheduled";
}

export function buildDayRange(
  project: Pick<Project, "start_date" | "end_date">,
  tasks: Pick<Task, "planned_start" | "planned_end">[]
): { days: Date[]; rangeStart: Date } {
  const dates: Date[] = [];
  if (project.start_date) dates.push(new Date(project.start_date));
  if (project.end_date) dates.push(new Date(project.end_date));
  tasks.forEach((t) => {
    if (t.planned_start) dates.push(new Date(t.planned_start));
    if (t.planned_end) dates.push(new Date(t.planned_end));
  });

  if (dates.length === 0) return { days: [], rangeStart: new Date() };

  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));

  min.setDate(min.getDate() - 3);
  max.setDate(max.getDate() + 7);

  const days: Date[] = [];
  const cursor = new Date(min);
  while (cursor <= max) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return { days, rangeStart: min };
}

export function groupByMonth(days: Date[]): { label: string; count: number }[] {
  const groups: { label: string; count: number }[] = [];
  for (const d of days) {
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.count++;
    else groups.push({ label, count: 1 });
  }
  return groups;
}

export function findTodayIndex(days: Date[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return days.findIndex((d) => sameDay(d, today));
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function diffDays(from: Date, to: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / MS_PER_DAY);
}

export function computeBarStyle(
  task: Pick<Task, "planned_start" | "planned_end">,
  rangeStart: Date,
  colWidth: number
): { left: number; width: number } | null {
  if (!task.planned_start || !task.planned_end) return null;
  const start = new Date(task.planned_start);
  const end = new Date(task.planned_end);
  const startOffset = diffDays(rangeStart, start);
  const duration = Math.max(1, diffDays(start, end) + 1);
  return { left: startOffset * colWidth + 2, width: duration * colWidth - 4 };
}

export interface TaskGroup<T> {
  macro_task: string;
  fase_macro: number;
  tasks: T[];
}

export function groupTasksByMacro<T extends Pick<Task, "macro_task" | "fase_macro">>(
  tasks: T[]
): TaskGroup<T>[] {
  const map = new Map<string, TaskGroup<T>>();
  for (const t of tasks) {
    const key = `${t.fase_macro}-${t.macro_task}`;
    if (!map.has(key)) {
      map.set(key, { macro_task: t.macro_task, fase_macro: t.fase_macro, tasks: [] });
    }
    map.get(key)!.tasks.push(t);
  }
  return Array.from(map.values());
}

/** Raggruppa i task di UNA fase per Micro-Task, usato per calcolare gli stati aggregati nel Gantt */
export function groupTasksByMicroWithin<T extends Pick<Task, "micro_task" | "fase_micro">>(
  tasks: T[]
): { fase_micro: number; micro_task: string; tasks: T[] }[] {
  const map = new Map<string, { fase_micro: number; micro_task: string; tasks: T[] }>();
  for (const t of tasks) {
    const key = `${t.fase_micro}-${t.micro_task}`;
    if (!map.has(key)) {
      map.set(key, { fase_micro: t.fase_micro, micro_task: t.micro_task, tasks: [] });
    }
    map.get(key)!.tasks.push(t);
  }
  return Array.from(map.values());
}

export function findCurrentPhaseKey<
  T extends Pick<
    Task,
    "fase_macro" | "macro_task" | "planned_start" | "planned_end" | "is_scheduled" | "is_completed"
  >
>(groups: TaskGroup<T>[]): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const group of groups) {
    const withinRange = group.tasks.some((t) => {
      if (!t.planned_start || !t.planned_end) return false;
      const start = new Date(t.planned_start);
      const end = new Date(t.planned_end);
      return start <= today && today <= end;
    });
    if (withinRange) return `${group.fase_macro}-${group.macro_task}`;
  }

  for (const group of groups) {
    const hasInProgress = group.tasks.some((t) => t.is_scheduled && !t.is_completed);
    if (hasInProgress) return `${group.fase_macro}-${group.macro_task}`;
  }

  return null;
}

export const STATUS_STYLES: Record<
  TaskStatus,
  { bar: string; badgeBg: string; badgeText: string; label: string; dot: string }
> = {
  not_scheduled: {
    bar: "bg-[#e2445c]",
    badgeBg: "bg-[#e2445c]/10",
    badgeText: "text-[#e2445c]",
    label: "Da avviare",
    dot: "#e2445c",
  },
  in_progress: {
    bar: "bg-[#fdab3d]",
    badgeBg: "bg-[#fdab3d]/10",
    badgeText: "text-[#fdab3d]",
    label: "In corso",
    dot: "#fdab3d",
  },
  completed: {
    bar: "bg-[#00c875]",
    badgeBg: "bg-[#00c875]/10",
    badgeText: "text-[#00c875]",
    label: "Completato",
    dot: "#00c875",
  },
  overdue: {
    bar: "bg-[#e2445c]",
    badgeBg: "bg-[#e2445c]/10",
    badgeText: "text-[#e2445c]",
    label: "In ritardo",
    dot: "#e2445c",
  },
};
