// ============================================================
// FILE (RISCRITTO): components/project/project-tabs.tsx
// Ora 3 tab: Alert (primo/default) → Cronoprogramma → Lista Task
// ============================================================

import Link from "next/link";
import { AlertTriangle, CalendarRange, ListTodo } from "lucide-react";

export function ProjectTabs({
  projectId,
  active,
}: {
  projectId: string;
  active: "alerts" | "gantt" | "tasks";
}) {
  const tabs = [
    { key: "alerts" as const, label: "Alert", href: `/projects/${projectId}/alerts`, icon: AlertTriangle },
    { key: "gantt" as const, label: "Cronoprogramma", href: `/projects/${projectId}/gantt`, icon: CalendarRange },
    { key: "tasks" as const, label: "Lista Task", href: `/projects/${projectId}/tasks`, icon: ListTodo },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-[#579bfc] text-[#579bfc]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

