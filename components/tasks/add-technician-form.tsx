// ============================================================
// FILE (NUOVO): components/tasks/add-technician-form.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { addTaskToGroup } from "@/app/(dashboard)/projects/[projectId]/tasks/actions";

interface AddTechnicianFormProps {
  projectId: string;
  faseMacro: number;
  macroTask: string;
  faseMicro: number;
  microTask: string;
}

export function AddTechnicianForm({
  projectId,
  faseMacro,
  macroTask,
  faseMicro,
  microTask,
}: AddTechnicianFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    if (!name.trim() || !role.trim()) {
      setError("Nome e incarico sono obbligatori.");
      return;
    }

    startTransition(async () => {
      try {
        await addTaskToGroup(projectId, faseMacro, macroTask, faseMicro, microTask, {
          name: name.trim(),
          role: role.trim(),
          email: email.trim() || null,
        });
        setName("");
        setRole("");
        setEmail("");
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore durante il salvataggio");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#579bfc] px-4 py-3 hover:bg-[#579bfc]/5 transition-colors w-full"
      >
        <Plus className="h-4 w-4" />
        Aggiungi tecnico
      </button>
    );
  }

  return (
    <div className="px-4 py-4 bg-slate-50 space-y-3 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Nuovo tecnico</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome e cognome"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Tipo di incarico (es. Tecn: geometra)"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email (opzionale)"
          className="text-sm border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="text-sm font-semibold bg-[#579bfc] text-white rounded-lg px-4 py-2 hover:bg-[#4a8ae8] transition-colors disabled:opacity-50"
      >
        {isPending ? "Salvataggio..." : "Aggiungi"}
      </button>
    </div>
  );
}

