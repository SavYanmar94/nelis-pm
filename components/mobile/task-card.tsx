// ============================================================
// FILE: components/mobile/task-card.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { Lock, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toggleTaskField } from "@/app/(dashboard)/projects/[projectId]/tasks/actions";
import { computeTaskStatus, STATUS_STYLES } from "@/lib/utils/gantt";
import type { TaskWithStakeholder } from "@/lib/types";

export function TaskCard({ task }: { task: TaskWithStakeholder }) {
  const [isScheduled, setIsScheduled] = useState(task.is_scheduled);
  const [isCompleted, setIsCompleted] = useState(task.is_completed);
  const [, startTransition] = useTransition();

  const status = computeTaskStatus({ is_scheduled: isScheduled, is_completed: isCompleted });
  const style = STATUS_STYLES[status];

  function handleScheduledChange(value: boolean) {
    const prevScheduled = isScheduled;
    const prevCompleted = isCompleted;

    setIsScheduled(value);
    // Se si toglie "Schedulato", non ha senso restare "Completato"
    if (!value) setIsCompleted(false);

    startTransition(async () => {
      try {
        await toggleTaskField(task.id, "is_scheduled", value);
        if (!value && prevCompleted) {
          await toggleTaskField(task.id, "is_completed", false);
        }
      } catch {
        setIsScheduled(prevScheduled);
        setIsCompleted(prevCompleted);
      }
    });
  }

  function handleCompletedChange(value: boolean) {
    const prev = isCompleted;
    setIsCompleted(value);

    startTransition(() => {
      toggleTaskField(task.id, "is_completed", value).catch(() => {
        setIsCompleted(prev);
      });
    });
  }

  return (
    <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: style.dot }}>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm text-slate-800 truncate">{task.micro_task}</p>
            <p className="text-xs text-slate-500 truncate">{task.macro_task}</p>
          </div>
          <Badge className={`shrink-0 ${style.badgeBg} ${style.badgeText} hover:${style.badgeBg} border-0`}>
            {style.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">{task.stakeholder?.name ?? task.department ?? "—"}</span>
          {task.planned_end && (
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3" />
              {formatDate(task.planned_end)}
            </span>
          )}
        </div>

        {task.is_blocking && (
          <p className="flex items-center gap-1 text-xs font-medium" style={{ color: "#e2445c" }}>
            <Lock className="h-3 w-3" /> Autorizzazione mancante
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Switch checked={isScheduled} onCheckedChange={handleScheduledChange} />
            Schedulato
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Switch checked={isCompleted} onCheckedChange={handleCompletedChange} disabled={!isScheduled} />
            Completato
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}