// ============================================================
// FILE: components/mobile/task-card-list.tsx
// ============================================================

import { TaskCard } from "./task-card";
import { groupTasksByMacro } from "@/lib/utils/gantt";
import type { TaskWithStakeholder } from "@/lib/types";

export function TaskCardList({ tasks }: { tasks: TaskWithStakeholder[] }) {
  const groups = groupTasksByMacro(tasks);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nessun task in questo cantiere.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={`${g.fase_macro}-${g.macro_task}`}>
          <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-2 px-1">
            {g.macro_task}
          </h3>
          <div className="space-y-2">
            {g.tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}