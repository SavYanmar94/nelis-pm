// ============================================================
// FILE (RISCRITTO): components/tasks/task-list-view.tsx
// TaskListRow: "Pianificato + Blocco" → singola "Data stimata completamento"
// (MacroGroupEditor/MicroGroupEditor/TaskListView invariati rispetto
// alla versione precedente, riportati per completezza)
// ============================================================

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  toggleTaskField,
  updateTaskDate,
  updateTaskPredecessor,
  deleteTask,
  renameMacroTask,
  renameMicroTask,
  deleteMacroTaskGroup,
  deleteMicroTaskGroup,
  addMacroTaskGroup,
  addMicroTaskGroup,
} from "@/app/(dashboard)/projects/[projectId]/tasks/actions";
import { AddTechnicianForm } from "@/components/tasks/add-technician-form";
import { computeTaskStatus, computeGroupStatus, STATUS_STYLES } from "@/lib/utils/gantt";
import type { TaskWithStakeholder } from "@/lib/types";

interface MicroGroup {
  fase_micro: number;
  micro_task: string;
  tasks: TaskWithStakeholder[];
}
interface MacroGroup {
  fase_macro: number;
  macro_task: string;
  microGroups: MicroGroup[];
}

function groupHierarchical(tasks: TaskWithStakeholder[]): MacroGroup[] {
  const macroMap = new Map<string, MacroGroup>();
  for (const t of tasks) {
    const macroKey = `${t.fase_macro}-${t.macro_task}`;
    if (!macroMap.has(macroKey)) {
      macroMap.set(macroKey, { fase_macro: t.fase_macro, macro_task: t.macro_task, microGroups: [] });
    }
    const macro = macroMap.get(macroKey)!;
    const microKey = `${t.fase_micro}-${t.micro_task}`;
    let micro = macro.microGroups.find((m) => `${m.fase_micro}-${m.micro_task}` === microKey);
    if (!micro) {
      micro = { fase_micro: t.fase_micro, micro_task: t.micro_task, tasks: [] };
      macro.microGroups.push(micro);
    }
    micro.tasks.push(t);
  }
  return Array.from(macroMap.values());
}

export function TaskListView({ tasks, projectId }: { tasks: TaskWithStakeholder[]; projectId: string }) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isAddingMacro, setIsAddingMacro] = useState(false);
  const [newMacroFase, setNewMacroFase] = useState(0);
  const [newMacroName, setNewMacroName] = useState("");
  const [, startTransition] = useTransition();

  const visibleTasks = useMemo(() => tasks.filter((t) => !deletedIds.has(t.id)), [tasks, deletedIds]);
  const groups = useMemo(() => groupHierarchical(visibleTasks), [visibleTasks]);

  function handleDeletedTask(taskId: string) {
    setDeletedIds((prev) => new Set(prev).add(taskId));
  }

  function handleAddMacro() {
    if (!newMacroName.trim()) return;
    startTransition(async () => {
      await addMacroTaskGroup(projectId, newMacroFase, newMacroName.trim());
      setNewMacroName("");
      setNewMacroFase(0);
      setIsAddingMacro(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun task in questo cantiere.</p>
      )}

      {groups.map((macro) => (
        <MacroGroupEditor
          key={`${macro.fase_macro}-${macro.macro_task}`}
          projectId={projectId}
          macro={macro}
          allTasks={visibleTasks}
          onDeletedTask={handleDeletedTask}
        />
      ))}

      {isAddingMacro ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 space-y-3 bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">Nuova fase</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={newMacroFase}
              onChange={(e) => setNewMacroFase(Number(e.target.value))}
              className="text-sm font-bold text-center w-16 border border-slate-300 rounded-lg px-1 py-2"
            />
            <input
              value={newMacroName}
              onChange={(e) => setNewMacroName(e.target.value)}
              placeholder="Nome fase"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddMacro}
              className="text-sm font-semibold bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
            >
              Crea fase
            </button>
            <button
              type="button"
              onClick={() => setIsAddingMacro(false)}
              className="text-sm font-medium text-slate-500 px-4 py-2"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingMacro(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Aggiungi fase
        </button>
      )}
    </div>
  );
}

function MacroGroupEditor({
  projectId,
  macro,
  allTasks,
  onDeletedTask,
}: {
  projectId: string;
  macro: MacroGroup;
  allTasks: TaskWithStakeholder[];
  onDeletedTask: (taskId: string) => void;
}) {
  const router = useRouter();
  const [faseMacro, setFaseMacro] = useState(macro.fase_macro);
  const [macroTask, setMacroTask] = useState(macro.macro_task);
  const [isAddingMicro, setIsAddingMicro] = useState(false);
  const [newMicroFase, setNewMicroFase] = useState(0);
  const [newMicroName, setNewMicroName] = useState("");
  const [, startTransition] = useTransition();

  function commitRename() {
    if (faseMacro === macro.fase_macro && macroTask === macro.macro_task) return;
    startTransition(async () => {
      await renameMacroTask(projectId, macro.fase_macro, macro.macro_task, faseMacro, macroTask);
      router.refresh();
    });
  }

  function handleDeleteGroup() {
    const totalTasks = macro.microGroups.reduce((sum, m) => sum + m.tasks.length, 0);
    const conferma = window.confirm(
      `Eliminare la fase "${macro.macro_task}" e tutti i suoi ${totalTasks} task?\n\nL'operazione non è reversibile.`
    );
    if (!conferma) return;
    startTransition(async () => {
      await deleteMacroTaskGroup(projectId, macro.fase_macro, macro.macro_task);
      router.refresh();
    });
  }

  function handleAddMicro() {
    if (!newMicroName.trim()) return;
    startTransition(async () => {
      await addMicroTaskGroup(projectId, macro.fase_macro, macro.macro_task, newMicroFase, newMicroName.trim());
      setNewMicroName("");
      setNewMicroFase(0);
      setIsAddingMicro(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <input
          type="number"
          value={faseMacro}
          onChange={(e) => setFaseMacro(Number(e.target.value))}
          onBlur={commitRename}
          className="text-base font-bold text-center w-14 h-10 rounded-full border-2 border-slate-900 bg-slate-900 text-white"
        />
        <input
          value={macroTask}
          onChange={(e) => setMacroTask(e.target.value)}
          onBlur={commitRename}
          className="text-lg font-bold border border-transparent hover:border-slate-300 focus:border-slate-300 rounded-lg px-2 py-1 flex-1 bg-transparent outline-none"
        />
        <button
          type="button"
          onClick={handleDeleteGroup}
          title="Elimina fase"
          className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg text-[#e2445c] hover:bg-[#e2445c]/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {macro.microGroups.map((micro) => (
          <MicroGroupEditor
            key={`${micro.fase_micro}-${micro.micro_task}`}
            projectId={projectId}
            faseMacro={macro.fase_macro}
            macroTask={macro.macro_task}
            micro={micro}
            allTasks={allTasks}
            onDeletedTask={onDeletedTask}
          />
        ))}
      </div>

      {isAddingMicro ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 space-y-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={newMicroFase}
              onChange={(e) => setNewMicroFase(Number(e.target.value))}
              className="text-sm font-bold text-center w-14 border border-slate-300 rounded-lg px-1 py-1.5"
            />
            <input
              value={newMicroName}
              onChange={(e) => setNewMicroName(e.target.value)}
              placeholder="Nome micro-fase"
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddMicro}
              className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg px-3 py-1.5 transition-colors"
            >
              Crea micro-fase
            </button>
            <button
              type="button"
              onClick={() => setIsAddingMicro(false)}
              className="text-sm text-slate-500 px-3 py-1.5"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingMicro(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors w-full justify-center border-2 border-dashed border-slate-300"
        >
          <Plus className="h-4 w-4" />
          Aggiungi micro-fase
        </button>
      )}
    </div>
  );
}

function MicroGroupEditor({
  projectId,
  faseMacro,
  macroTask,
  micro,
  allTasks,
  onDeletedTask,
}: {
  projectId: string;
  faseMacro: number;
  macroTask: string;
  micro: MicroGroup;
  allTasks: TaskWithStakeholder[];
  onDeletedTask: (taskId: string) => void;
}) {
  const router = useRouter();
  const [faseMicro, setFaseMicro] = useState(micro.fase_micro);
  const [microTaskName, setMicroTaskName] = useState(micro.micro_task);
  const [, startTransition] = useTransition();

  const groupStatus = computeGroupStatus(micro.tasks);
  const style = STATUS_STYLES[groupStatus];

  function commitRename() {
    if (faseMicro === micro.fase_micro && microTaskName === micro.micro_task) return;
    startTransition(async () => {
      await renameMicroTask(
        projectId,
        faseMacro,
        macroTask,
        micro.fase_micro,
        micro.micro_task,
        faseMicro,
        microTaskName
      );
      router.refresh();
    });
  }

  function handleDeleteGroup() {
    const conferma = window.confirm(
      `Eliminare la micro-fase "${micro.micro_task}" e tutti i suoi ${micro.tasks.length} task?\n\nL'operazione non è reversibile.`
    );
    if (!conferma) return;
    startTransition(async () => {
      await deleteMicroTaskGroup(projectId, faseMacro, macroTask, micro.fase_micro, micro.micro_task);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: style.dot }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: style.dot }}>
        <input
          type="number"
          value={faseMicro}
          onChange={(e) => setFaseMicro(Number(e.target.value))}
          onBlur={commitRename}
          className="text-sm font-bold text-center w-12 border-0 rounded-lg px-1 py-1 bg-white/90 outline-none"
        />
        <input
          value={microTaskName}
          onChange={(e) => setMicroTaskName(e.target.value)}
          onBlur={commitRename}
          className="text-base font-bold border-0 rounded-lg px-2 py-1 bg-transparent text-white placeholder-white/70 flex-1 focus:bg-white/10 outline-none"
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-white/90 shrink-0">
          {style.label}
        </span>
        <button
          type="button"
          onClick={handleDeleteGroup}
          title="Elimina micro-fase"
          className="shrink-0 flex items-center justify-center h-7 w-7 rounded-lg text-white/80 hover:bg-white/20 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white divide-y divide-slate-100">
        {micro.tasks.map((task) => (
          <TaskListRow key={task.id} task={task} allTasks={allTasks} onDeleted={onDeletedTask} />
        ))}
      </div>

      <AddTechnicianForm
        projectId={projectId}
        faseMacro={faseMacro}
        macroTask={macroTask}
        faseMicro={micro.fase_micro}
        microTask={micro.micro_task}
      />
    </div>
  );
}

function TaskListRow({
  task,
  allTasks,
  onDeleted,
}: {
  task: TaskWithStakeholder;
  allTasks: TaskWithStakeholder[];
  onDeleted: (taskId: string) => void;
}) {
  const [isScheduled, setIsScheduled] = useState(task.is_scheduled);
  const [isCompleted, setIsCompleted] = useState(task.is_completed);
  const [actualStart, setActualStart] = useState(task.actual_start ? task.actual_start.slice(0, 10) : "");
  const [actualEnd, setActualEnd] = useState(task.actual_end ? task.actual_end.slice(0, 10) : "");
  const [estimatedCompletion, setEstimatedCompletion] = useState(
    task.planned_end ? task.planned_end.slice(0, 10) : ""
  );
  const [predecessorId, setPredecessorId] = useState(task.predecessor_task_id ?? "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const stakeholderLine = task.stakeholder
    ? `${task.stakeholder.name} — ${task.stakeholder.role}${
        task.stakeholder.email ? ` — ${task.stakeholder.email}` : ""
      }`
    : task.department ?? "—";

  const predecessorOptions = allTasks.filter((t) => t.id !== task.id);
  const rowStatus = computeTaskStatus({
    is_scheduled: isScheduled,
    is_completed: isCompleted,
    planned_end: estimatedCompletion || null,
  });
  const rowStyle = STATUS_STYLES[rowStatus];

  function handleScheduledChange(value: boolean) {
    setIsScheduled(value);
    if (!value) {
      setIsCompleted(false);
      setActualStart("");
      setActualEnd("");
    } else if (!actualStart) {
      setActualStart(new Date().toISOString().slice(0, 10));
    }

    startTransition(async () => {
      try {
        await toggleTaskField(task.id, "is_scheduled", value);
        if (!value) await toggleTaskField(task.id, "is_completed", false);
      } catch {
        setIsScheduled(task.is_scheduled);
      }
    });
  }

  function handleCompletedChange(value: boolean) {
    setIsCompleted(value);
    if (value && !actualEnd) setActualEnd(new Date().toISOString().slice(0, 10));
    if (!value) setActualEnd("");

    startTransition(() => {
      toggleTaskField(task.id, "is_completed", value).catch(() => setIsCompleted(task.is_completed));
    });
  }

  function handleActualDateChange(field: "actual_start" | "actual_end", value: string) {
    if (field === "actual_start") setActualStart(value);
    else setActualEnd(value);

    startTransition(() => {
      updateTaskDate(task.id, field, value || null).catch(() => {
        if (field === "actual_start") setActualStart(task.actual_start?.slice(0, 10) ?? "");
        else setActualEnd(task.actual_end?.slice(0, 10) ?? "");
      });
    });
  }

  function handleEstimatedCompletionChange(value: string) {
    setEstimatedCompletion(value);
    startTransition(() => {
      updateTaskDate(task.id, "planned_end", value || null).catch(() => {
        setEstimatedCompletion(task.planned_end?.slice(0, 10) ?? "");
      });
    });
  }

  function handlePredecessorChange(value: string) {
    setPredecessorId(value);
    startTransition(() => {
      updateTaskPredecessor(task.id, value || null).catch(() => {
        setPredecessorId(task.predecessor_task_id ?? "");
      });
    });
  }

  function handleDelete() {
    const conferma = window.confirm(
      `Rimuovere "${stakeholderLine}" da questo task?\n\nL'operazione non è reversibile.`
    );
    if (!conferma) return;

    setIsDeleting(true);
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        onDeleted(task.id);
      } catch {
        setIsDeleting(false);
        window.alert("Impossibile rimuovere il task. Riprova.");
      }
    });
  }

  return (
    <div
      className={`flex flex-col gap-4 px-4 py-4 transition-opacity ${
        isDeleting ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="h-3 w-3 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: rowStyle.dot }} />
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-800 truncate">{stakeholderLine}</p>
          {rowStatus === "overdue" && (
            <p className="text-sm font-medium mt-1" style={{ color: "#e2445c" }}>
              In ritardo rispetto alla data stimata
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 sm:gap-6 pl-6">
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 whitespace-nowrap">
            <Switch checked={isScheduled} onCheckedChange={handleScheduledChange} />
            Schedulato
          </label>
          <input
            type="date"
            value={actualStart}
            onChange={(e) => handleActualDateChange("actual_start", e.target.value)}
            disabled={!isScheduled}
            className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:opacity-40 disabled:bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 whitespace-nowrap">
            <Switch checked={isCompleted} onCheckedChange={handleCompletedChange} disabled={!isScheduled} />
            Completato
          </label>
          <input
            type="date"
            value={actualEnd}
            onChange={(e) => handleActualDateChange("actual_end", e.target.value)}
            disabled={!isCompleted}
            className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:opacity-40 disabled:bg-slate-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Data stimata completamento
          </label>
          <input
            type="date"
            value={estimatedCompletion}
            onChange={(e) => handleEstimatedCompletionChange(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5"
          />
        </div>

        <div className="flex items-end gap-2 w-full sm:w-auto sm:min-w-[280px]">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Task correlato
            </label>
            <select
              value={predecessorId}
              onChange={(e) => handlePredecessorChange(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white w-full"
            >
              <option value="">Nessuno</option>
              {predecessorOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fase_micro} - {t.micro_task} ({t.department ?? "—"})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            title="Rimuovi questo task"
            className="shrink-0 flex items-center justify-center h-[38px] w-[38px] rounded-lg border-2 border-[#e2445c]/30 text-[#e2445c] hover:bg-[#e2445c]/10 hover:border-[#e2445c] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}