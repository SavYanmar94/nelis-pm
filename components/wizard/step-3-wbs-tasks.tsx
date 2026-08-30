// ============================================================
// FILE (RISCRITTO): components/wizard/step-3-wbs-tasks.tsx
// Il dropdown "Ruolo comune" ora legge da rolePresets (database)
// invece della lista fissa nel codice
// ============================================================

"use client";

import { Plus, Trash2, X } from "lucide-react";
import type { Stakeholder, RolePreset, TemplateTaskSeed, CreateProjectPayload } from "@/lib/types";

export interface WbsRow {
  tempId: string;
  department: string;
  stakeholder_id: string | null;
  stakeholder_name: string;
  stakeholder_email: string;
  planned_start: string;
  planned_end: string;
  is_blocking: boolean;
}

export interface WbsMicroGroup {
  tempId: string;
  fase_micro: number;
  micro_task: string;
  rows: WbsRow[];
}

export interface WbsMacroGroup {
  tempId: string;
  fase_macro: number;
  macro_task: string;
  microGroups: WbsMicroGroup[];
}

function newRow(): WbsRow {
  return {
    tempId: crypto.randomUUID(),
    department: "",
    stakeholder_id: null,
    stakeholder_name: "",
    stakeholder_email: "",
    planned_start: "",
    planned_end: "",
    is_blocking: false,
  };
}

export function templateToWbsGroups(seeds: TemplateTaskSeed[]): WbsMacroGroup[] {
  const macroMap = new Map<string, WbsMacroGroup>();

  for (const seed of seeds) {
    const macroKey = `${seed.fase_macro}-${seed.macro_task}`;
    if (!macroMap.has(macroKey)) {
      macroMap.set(macroKey, {
        tempId: crypto.randomUUID(),
        fase_macro: seed.fase_macro,
        macro_task: seed.macro_task,
        microGroups: [],
      });
    }
    const macro = macroMap.get(macroKey)!;

    macro.microGroups.push({
      tempId: crypto.randomUUID(),
      fase_micro: seed.fase_micro,
      micro_task: seed.micro_task,
      rows: seed.departments.map((dept) => ({ ...newRow(), department: dept })),
    });
  }

  return Array.from(macroMap.values());
}

export function flattenWbsGroups(groups: WbsMacroGroup[]): CreateProjectPayload["tasks"] {
  const result: CreateProjectPayload["tasks"] = [];

  for (const macro of groups) {
    for (const micro of macro.microGroups) {
      for (const row of micro.rows) {
        result.push({
          fase_macro: macro.fase_macro,
          macro_task: macro.macro_task,
          fase_micro: micro.fase_micro,
          micro_task: micro.micro_task,
          department: row.department,
          stakeholder_id: row.stakeholder_id,
          stakeholder_name: row.stakeholder_name || null,
          stakeholder_email: row.stakeholder_email || null,
          planned_start: row.planned_start || null,
          planned_end: row.planned_end || null,
          is_blocking: row.is_blocking,
        });
      }
    }
  }

  return result;
}

function WbsRowEditor({
  row,
  existingStakeholders,
  rolePresets,
  onChange,
  onRemove,
}: {
  row: WbsRow;
  existingStakeholders: Stakeholder[];
  rolePresets: RolePreset[];
  onChange: (patch: Partial<WbsRow>) => void;
  onRemove: () => void;
}) {
  function handlePickExisting(id: string) {
    if (!id) return;
    const s = existingStakeholders.find((x) => x.id === id);
    if (!s) return;
    onChange({
      stakeholder_id: s.id,
      stakeholder_name: s.name,
      department: s.role,
      stakeholder_email: s.email ?? "",
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {existingStakeholders.length > 0 && (
          <select
            value=""
            onChange={(e) => handlePickExisting(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">🔍 Cerca in rubrica…</option>
            {existingStakeholders.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.role}
              </option>
            ))}
          </select>
        )}
        <select
          value=""
          onChange={(e) => e.target.value && onChange({ department: e.target.value })}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">📋 Ruolo comune…</option>
          {rolePresets.map((r) => (
            <option key={r.id} value={r.label}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={row.stakeholder_name}
          onChange={(e) => onChange({ stakeholder_name: e.target.value, stakeholder_id: null })}
          placeholder="Nome e cognome"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2"
        />
        <input
          value={row.department}
          onChange={(e) => onChange({ department: e.target.value })}
          placeholder="Ruolo/Reparto"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2"
        />
        <input
          value={row.stakeholder_email}
          onChange={(e) => onChange({ stakeholder_email: e.target.value })}
          type="email"
          placeholder="Email (opzionale)"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 text-sm font-medium text-[#e2445c] hover:bg-[#e2445c]/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
          Rimuovi
        </button>
      </div>
    </div>
  );
}

function WbsMicroEditor({
  micro,
  existingStakeholders,
  rolePresets,
  onChange,
  onRemove,
}: {
  micro: WbsMicroGroup;
  existingStakeholders: Stakeholder[];
  rolePresets: RolePreset[];
  onChange: (updated: WbsMicroGroup) => void;
  onRemove: () => void;
}) {
  function updateRow(rowId: string, patch: Partial<WbsRow>) {
    onChange({ ...micro, rows: micro.rows.map((r) => (r.tempId === rowId ? { ...r, ...patch } : r)) });
  }
  function removeRow(rowId: string) {
    onChange({ ...micro, rows: micro.rows.filter((r) => r.tempId !== rowId) });
  }
  function addRow() {
    onChange({ ...micro, rows: [...micro.rows, newRow()] });
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-100">
        <input
          type="number"
          value={micro.fase_micro}
          onChange={(e) => onChange({ ...micro, fase_micro: Number(e.target.value) })}
          className="text-sm font-bold text-center w-14 border border-slate-300 rounded-lg px-1 py-1.5 bg-white"
        />
        <input
          value={micro.micro_task}
          onChange={(e) => onChange({ ...micro, micro_task: e.target.value })}
          placeholder="Nome micro-fase"
          className="text-sm font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-white flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          title="Rimuovi micro-fase"
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-[#e2445c] hover:bg-[#e2445c]/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-3 bg-white">
        {micro.rows.map((row) => (
          <WbsRowEditor
            key={row.tempId}
            row={row}
            existingStakeholders={existingStakeholders}
            rolePresets={rolePresets}
            onChange={(patch) => updateRow(row.tempId, patch)}
            onRemove={() => removeRow(row.tempId)}
          />
        ))}

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#579bfc] hover:bg-[#579bfc]/5 rounded-lg px-3 py-2 transition-colors w-full justify-center border-2 border-dashed border-[#579bfc]/30"
        >
          <Plus className="h-4 w-4" />
          Aggiungi tecnico
        </button>
      </div>
    </div>
  );
}

function WbsMacroEditor({
  macro,
  existingStakeholders,
  rolePresets,
  onChange,
  onRemove,
}: {
  macro: WbsMacroGroup;
  existingStakeholders: Stakeholder[];
  rolePresets: RolePreset[];
  onChange: (updated: WbsMacroGroup) => void;
  onRemove: () => void;
}) {
  function updateMicro(microId: string, updated: WbsMicroGroup) {
    onChange({ ...macro, microGroups: macro.microGroups.map((m) => (m.tempId === microId ? updated : m)) });
  }
  function removeMicro(microId: string) {
    onChange({ ...macro, microGroups: macro.microGroups.filter((m) => m.tempId !== microId) });
  }
  function addMicro() {
    const nextFaseMicro =
      macro.microGroups.length > 0 ? Math.max(...macro.microGroups.map((m) => m.fase_micro)) + 1 : 0;
    onChange({
      ...macro,
      microGroups: [
        ...macro.microGroups,
        { tempId: crypto.randomUUID(), fase_micro: nextFaseMicro, micro_task: "", rows: [] },
      ],
    });
  }

  return (
    <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={macro.fase_macro}
          onChange={(e) => onChange({ ...macro, fase_macro: Number(e.target.value) })}
          className="text-base font-bold text-center w-14 h-10 rounded-full border-2 border-slate-900 bg-slate-900 text-white"
        />
        <input
          value={macro.macro_task}
          onChange={(e) => onChange({ ...macro, macro_task: e.target.value })}
          placeholder="Nome fase"
          className="text-lg font-bold border border-slate-300 rounded-lg px-3 py-2 flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          title="Rimuovi fase"
          className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg border-2 border-[#e2445c]/30 text-[#e2445c] hover:bg-[#e2445c]/10 hover:border-[#e2445c] transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {macro.microGroups.map((micro) => (
          <WbsMicroEditor
            key={micro.tempId}
            micro={micro}
            existingStakeholders={existingStakeholders}
            rolePresets={rolePresets}
            onChange={(updated) => updateMicro(micro.tempId, updated)}
            onRemove={() => removeMicro(micro.tempId)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addMicro}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors w-full justify-center border-2 border-dashed border-slate-300"
      >
        <Plus className="h-4 w-4" />
        Aggiungi micro-fase
      </button>
    </div>
  );
}

export function StepWbsTasks({
  groups,
  onChange,
  existingStakeholders,
  rolePresets,
  saveAsTemplate,
  onToggleSaveAsTemplate,
  templateTitle,
  onTemplateTitleChange,
}: {
  groups: WbsMacroGroup[];
  onChange: (groups: WbsMacroGroup[]) => void;
  existingStakeholders: Stakeholder[];
  rolePresets: RolePreset[];
  saveAsTemplate: boolean;
  onToggleSaveAsTemplate: (v: boolean) => void;
  templateTitle: string;
  onTemplateTitleChange: (v: string) => void;
}) {
  function updateMacro(macroId: string, updated: WbsMacroGroup) {
    onChange(groups.map((m) => (m.tempId === macroId ? updated : m)));
  }
  function removeMacro(macroId: string) {
    onChange(groups.filter((m) => m.tempId !== macroId));
  }
  function addMacro() {
    const nextFaseMacro = groups.length > 0 ? Math.max(...groups.map((m) => m.fase_macro)) + 1 : 0;
    onChange([
      ...groups,
      { tempId: crypto.randomUUID(), fase_macro: nextFaseMacro, macro_task: "", microGroups: [] },
    ]);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Costruisci la WBS: ogni <strong>Fase</strong> ha un numero e un nome; al suo interno le{" "}
        <strong>Micro-Fasi</strong> (numerate) contengono i tecnici coinvolti.
      </p>

      {groups.map((macro) => (
        <WbsMacroEditor
          key={macro.tempId}
          macro={macro}
          existingStakeholders={existingStakeholders}
          rolePresets={rolePresets}
          onChange={(updated) => updateMacro(macro.tempId, updated)}
          onRemove={() => removeMacro(macro.tempId)}
        />
      ))}

      <button
        type="button"
        onClick={addMacro}
        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg px-4 py-2.5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Aggiungi fase
      </button>

      <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 space-y-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="saveTemplate"
            checked={saveAsTemplate}
            onChange={(e) => onToggleSaveAsTemplate(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="saveTemplate" className="text-sm font-medium text-slate-700">
            Salva questa WBS come nuovo template
          </label>
        </div>
        {saveAsTemplate && (
          <input
            value={templateTitle}
            onChange={(e) => onTemplateTitleChange(e.target.value)}
            placeholder="Nome del nuovo template"
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 w-full"
          />
        )}
      </div>
    </div>
  );
}
