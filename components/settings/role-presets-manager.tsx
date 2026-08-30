// ============================================================
// FILE (NUOVO): components/settings/role-presets-manager.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Check } from "lucide-react";
import { addRolePreset, updateRolePreset, deleteRolePreset } from "@/app/(dashboard)/settings/actions";
import type { RolePreset } from "@/lib/types";

export function RolePresetsManager({
  companyId,
  presets,
}: {
  companyId: string;
  presets: RolePreset[];
}) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [, startTransition] = useTransition();

  function handleAdd() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      await addRolePreset(companyId, newLabel.trim());
      setNewLabel("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Rimuovere questo ruolo dall'elenco?")) return;
    startTransition(async () => {
      await deleteRolePreset(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {presets.map((p) => (
          <RolePresetRow
            key={p.id}
            preset={p}
            isGlobal={p.company_id === null}
            onDelete={() => handleDelete(p.id)}
          />
        ))}
        {presets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nessun ruolo salvato.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nuovo ruolo (es. Tecn: fonico)"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 flex-1"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg px-4 py-2 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Aggiungi
        </button>
      </div>
    </div>
  );
}

function RolePresetRow({
  preset,
  isGlobal,
  onDelete,
}: {
  preset: RolePreset;
  isGlobal: boolean;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(preset.label);
  const [, startTransition] = useTransition();

  function handleSave() {
    if (!label.trim()) return;
    startTransition(async () => {
      await updateRolePreset(preset.id, label.trim());
      setIsEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      {isEditing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          className="text-sm border border-slate-300 rounded-lg px-2 py-1 flex-1"
        />
      ) : (
        <p className="text-sm text-slate-700 flex-1">
          {preset.label}
          {isGlobal && <span className="ml-2 text-xs text-slate-400">(predefinito)</span>}
        </p>
      )}
      {!isGlobal && (
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              className="text-emerald-600 hover:bg-emerald-50 rounded p-1.5"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:bg-slate-100 rounded p-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-[#e2445c] hover:bg-[#e2445c]/10 rounded p-1.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
