// ============================================================
// FILE (RISCRITTO): components/gantt/gantt-chart.tsx
// Pallino di stato accanto al micro-task (per riga) e alla Fase
// (sostituisce la bandierina), stato "In ritardo" propagato alla barra
// ============================================================

"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";
import {
  buildDayRange,
  groupByMonth,
  findTodayIndex,
  isWeekend,
  groupTasksByMacro,
  groupTasksByMicroWithin,
  findCurrentPhaseKey,
  computeTaskStatus,
  computeGroupStatus,
  computeMacroStatus,
  computeBarStyle,
  STATUS_STYLES,
} from "@/lib/utils/gantt";
import type { Project, TaskWithStakeholder } from "@/lib/types";

const COL_WIDTH = 32;
const LABEL_WIDTH = 300;
const ROW_HEIGHT = 64;
const BAR_HEIGHT = 24;

export function GanttChart({ project, tasks }: { project: Project; tasks: TaskWithStakeholder[] }) {
  const { days, rangeStart } = useMemo(() => buildDayRange(project, tasks), [project, tasks]);
  const monthGroups = useMemo(() => groupByMonth(days), [days]);
  const todayIndex = useMemo(() => findTodayIndex(days), [days]);
  const taskGroups = useMemo(() => groupTasksByMacro(tasks), [tasks]);
  const currentPhaseKey = useMemo(() => findCurrentPhaseKey(taskGroups), [taskGroups]);

  if (days.length === 0) {
    return (
      <div className="border rounded-xl p-12 text-center text-muted-foreground bg-white">
        Nessuna data pianificata. Aggiungi date di inizio/fine ai task per visualizzare il Gantt.
      </div>
    );
  }

  const timelineWidth = days.length * COL_WIDTH;
  const todayLeft = todayIndex >= 0 ? todayIndex * COL_WIDTH + COL_WIDTH / 2 : null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_WIDTH + timelineWidth }}>
          <div className="flex sticky top-0 z-20 bg-white">
            <div
              className="sticky left-0 z-30 bg-white shrink-0 border-b border-r border-slate-200"
              style={{ width: LABEL_WIDTH }}
            />
            {monthGroups.map((g, i) => (
              <div
                key={i}
                className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide py-2 border-b border-r border-slate-200"
                style={{ width: g.count * COL_WIDTH }}
              >
                {g.label}
              </div>
            ))}
          </div>

          <div className="flex sticky top-[33px] z-20 bg-white">
            <div
              className="sticky left-0 z-30 bg-white shrink-0 border-b border-r border-slate-200"
              style={{ width: LABEL_WIDTH }}
            />
            {days.map((d, i) => {
              const weekend = isWeekend(d);
              const today = i === todayIndex;
              return (
                <div
                  key={i}
                  className={[
                    "text-center text-[11px] py-1.5 border-b border-r border-slate-100",
                    weekend ? "bg-slate-50 text-slate-400" : "text-slate-600",
                    today ? "bg-[#579bfc]/10 font-bold text-[#579bfc]" : "",
                  ].join(" ")}
                  style={{ width: COL_WIDTH }}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>

          {taskGroups.map((group) => {
            const groupKey = `${group.fase_macro}-${group.macro_task}`;
            const isCurrent = groupKey === currentPhaseKey;

            const microGroups = groupTasksByMicroWithin(group.tasks);
            const microStatuses = microGroups.map((m) => computeGroupStatus(m.tasks));
            const macroStatus = computeMacroStatus(microStatuses);
            const macroStyle = STATUS_STYLES[macroStatus];
            const isMacroCompleted = macroStatus === "completed";

            const headerBg = isCurrent ? (isMacroCompleted ? "bg-[#00c875]/10" : "bg-[#579bfc]/10") : "bg-slate-50";
            const headerText = isCurrent
              ? isMacroCompleted
                ? "text-[#00875a]"
                : "text-[#2f6fe0]"
              : "text-slate-700";
            const timelineBg = isCurrent
              ? isMacroCompleted
                ? "bg-[#00c875]/5"
                : "bg-[#579bfc]/5"
              : "bg-slate-50";

            return (
              <div key={groupKey}>
                <div className="flex">
                  <div
                    className={`sticky left-0 z-10 shrink-0 px-3 py-2 border-b border-r border-slate-200 font-semibold text-sm flex items-center gap-2 ${headerBg} ${headerText}`}
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: macroStyle.dot }} />
                    <span className="truncate">
                      {group.fase_macro} - {group.macro_task}
                    </span>
                    {isCurrent && (
                      <span
                        className="ml-auto shrink-0 text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: isMacroCompleted ? "#00c875" : "#579bfc" }}
                      >
                        {isMacroCompleted ? "Fase completata" : "Fase attuale"}
                      </span>
                    )}
                  </div>
                  <div className={`relative border-b border-slate-200 ${timelineBg}`} style={{ width: timelineWidth }}>
                    <WeekendStripes days={days} colWidth={COL_WIDTH} />
                    {todayLeft !== null && <TodayLine left={todayLeft} />}
                  </div>
                </div>

                {group.tasks.map((task) => (
                  <GanttTaskRow
                    key={task.id}
                    task={task}
                    days={days}
                    rangeStart={rangeStart}
                    todayLeft={todayLeft}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs">
        {(Object.keys(STATUS_STYLES) as (keyof typeof STATUS_STYLES)[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_STYLES[key].dot }} />
            <span className="text-slate-600">{STATUS_STYLES[key].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-slate-500" />
          <span className="text-slate-600">Autorizzazione mancante</span>
        </div>
      </div>
    </div>
  );
}

function WeekendStripes({ days, colWidth }: { days: Date[]; colWidth: number }) {
  return (
    <>
      {days.map((d, i) =>
        isWeekend(d) ? (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-slate-100/60"
            style={{ left: i * colWidth, width: colWidth }}
          />
        ) : null
      )}
    </>
  );
}

function TodayLine({ left }: { left: number }) {
  return <div className="absolute top-0 bottom-0 w-[2px] bg-[#e2445c] z-10" style={{ left }} />;
}

function GanttTaskRow({
  task,
  days,
  rangeStart,
  todayLeft,
}: {
  task: TaskWithStakeholder;
  days: Date[];
  rangeStart: Date;
  todayLeft: number | null;
}) {
  const status = computeTaskStatus(task);
  const style = STATUS_STYLES[status];
  const bar = computeBarStyle(task, rangeStart, COL_WIDTH);
  const timelineWidth = days.length * COL_WIDTH;

  return (
    <div className="flex border-b border-slate-100 hover:bg-slate-50/60 group">
      <div
        className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 shrink-0 px-3 py-2 border-r border-slate-200"
        style={{ width: LABEL_WIDTH }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: style.dot }} />
          <p className="text-sm font-medium text-slate-800 truncate">
            {task.fase_micro} - {task.micro_task}
          </p>
        </div>
        <p className="text-xs text-slate-500 truncate pl-4">
          {task.stakeholder?.name ?? task.department ?? "—"}
        </p>
      </div>

      <div className="relative" style={{ width: timelineWidth, height: ROW_HEIGHT }}>
        <WeekendStripes days={days} colWidth={COL_WIDTH} />
        {todayLeft !== null && <TodayLine left={todayLeft} />}

        {bar && (
          <div
            className={`absolute rounded-full flex items-center gap-1 px-2 shadow-sm ${style.bar}`}
            style={{
              left: bar.left,
              width: Math.max(bar.width, 16),
              height: BAR_HEIGHT,
              top: (ROW_HEIGHT - BAR_HEIGHT) / 2,
            }}
            title={`${task.micro_task} — ${style.label}`}
          >
            {task.is_blocking && <Lock className="h-3 w-3 text-white shrink-0" />}
            {bar.width > 60 && (
              <span className="text-[11px] font-medium text-white truncate">{task.department}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}