// ============================================================
// FILE (RISCRITTO): components/dashboard/morning-digest.tsx
// Alert annidati per Fase → Micro-Fase → tecnico (nome/ruolo/email)
// ============================================================

"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markNotificationRead } from "@/app/(dashboard)/dashboard/actions";
import type { DigestNotification } from "@/lib/queries/dashboard";

interface MorningDigestWidgetProps {
  red: DigestNotification[];
  yellow: DigestNotification[];
}

interface NotifMicroGroup {
  key: string;
  fase_micro: number;
  micro_task: string;
  items: DigestNotification[];
}
interface NotifMacroGroup {
  key: string;
  fase_macro: number;
  macro_task: string;
  microGroups: NotifMicroGroup[];
}

function groupNotifications(notifications: DigestNotification[]): NotifMacroGroup[] {
  const macroMap = new Map<string, NotifMacroGroup>();

  for (const n of notifications) {
    const faseMacro = n.task?.fase_macro ?? 0;
    const macroTask = n.task?.macro_task ?? "Altro";
    const faseMicro = n.task?.fase_micro ?? 0;
    const microTask = n.task?.micro_task ?? "Altro";

    const macroKey = `${faseMacro}-${macroTask}`;
    if (!macroMap.has(macroKey)) {
      macroMap.set(macroKey, { key: macroKey, fase_macro: faseMacro, macro_task: macroTask, microGroups: [] });
    }
    const macro = macroMap.get(macroKey)!;

    const microKey = `${faseMicro}-${microTask}`;
    let micro = macro.microGroups.find((m) => m.key === microKey);
    if (!micro) {
      micro = { key: microKey, fase_micro: faseMicro, micro_task: microTask, items: [] };
      macro.microGroups.push(micro);
    }
    micro.items.push(n);
  }

  return Array.from(macroMap.values());
}

export function MorningDigestWidget({ red, yellow }: MorningDigestWidgetProps) {
  const [, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleRed = red.filter((n) => !dismissed.has(n.id));
  const visibleYellow = yellow.filter((n) => !dismissed.has(n.id));
  const allClear = visibleRed.length === 0 && visibleYellow.length === 0;

  function handleMarkRead(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
    startTransition(() => {
      markNotificationRead(id).catch(() => {
        setDismissed((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<AlertTriangle className="h-6 w-6" />}
          label="Urgenti"
          count={visibleRed.length}
          colorClass="bg-red-50 border-red-200 text-red-700"
          iconBg="bg-red-100"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="In scadenza (24-48h)"
          count={visibleYellow.length}
          colorClass="bg-amber-50 border-amber-200 text-amber-700"
          iconBg="bg-amber-100"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Sotto controllo"
          count={allClear ? 1 : 0}
          colorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
          iconBg="bg-emerald-100"
          hideCountIfZero
        />
      </div>

      {allClear ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Tutto in regola!</p>
              <p className="text-sm text-emerald-700">
                Nessun task urgente o in scadenza in questo momento.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={visibleRed.length > 0 ? "red" : "yellow"}>
          <TabsList>
            <TabsTrigger value="red">🔴 Urgenti ({visibleRed.length})</TabsTrigger>
            <TabsTrigger value="yellow">🟡 In scadenza ({visibleYellow.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="red" className="space-y-4 mt-4">
            {visibleRed.length === 0 ? (
              <EmptyState text="Nessun task urgente." />
            ) : (
              groupNotifications(visibleRed).map((macro) => (
                <NotifMacroBlock key={macro.key} macro={macro} onMarkRead={handleMarkRead} tone="red" />
              ))
            )}
          </TabsContent>

          <TabsContent value="yellow" className="space-y-4 mt-4">
            {visibleYellow.length === 0 ? (
              <EmptyState text="Nessun task in scadenza." />
            ) : (
              groupNotifications(visibleYellow).map((macro) => (
                <NotifMacroBlock key={macro.key} macro={macro} onMarkRead={handleMarkRead} tone="yellow" />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function NotifMacroBlock({
  macro,
  onMarkRead,
  tone,
}: {
  macro: NotifMacroGroup;
  onMarkRead: (id: string) => void;
  tone: "red" | "yellow";
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-800">
        {macro.fase_macro} - {macro.macro_task}
      </p>
      {macro.microGroups.map((micro) => (
        <div key={micro.key} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-700">
              {micro.fase_micro} - {micro.micro_task}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {micro.items.map((n) => (
              <NotificationRow key={n.id} notification={n} onMarkRead={onMarkRead} tone={tone} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  count,
  colorClass,
  iconBg,
  hideCountIfZero = false,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  colorClass: string;
  iconBg: string;
  hideCountIfZero?: boolean;
}) {
  return (
    <Card className={`${colorClass} border`}>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`${iconBg} rounded-full p-2`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold leading-none">
            {hideCountIfZero && count === 0 ? "—" : count}
          </p>
          <p className="text-sm font-medium mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  tone,
}: {
  notification: DigestNotification;
  onMarkRead: (id: string) => void;
  tone: "red" | "yellow";
}) {
  const borderColor = tone === "red" ? "border-l-red-500" : "border-l-amber-500";
  const stakeholder = notification.task?.stakeholder;

  return (
    <div className={`px-3 py-3 border-l-4 ${borderColor} flex items-start justify-between gap-3`}>
      <div className="min-w-0">
        {stakeholder ? (
          <p className="text-sm font-medium truncate">
            {stakeholder.name} — {stakeholder.role}
            {stakeholder.email && (
              <a
                href={`mailto:${stakeholder.email}`}
                onClick={(e) => e.stopPropagation()}
                className="ml-2 text-[#579bfc] hover:underline"
              >
                {stakeholder.email}
              </a>
            )}
          </p>
        ) : (
          <p className="text-sm font-medium truncate">{notification.task?.department ?? "—"}</p>
        )}
        <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
        {notification.project?.name && (
          <p className="text-xs text-slate-400 mt-0.5">{notification.project.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/projects/${notification.project_id}/tasks?highlight=${notification.task_id}`}>
          <Button variant="ghost" size="icon" title="Apri task">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="icon"
          title="Segna come vista"
          onClick={() => onMarkRead(notification.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-4 text-center">{text}</p>;
}


// ==================