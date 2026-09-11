// ============================================================
// FILE (NUOVO): components/tasks/task-notes-dialog.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { updateTaskNotes } from "@/app/(dashboard)/projects/[projectId]/tasks/actions";

export function TaskNotesDialog({
  taskId,
  taskLabel,
  initialNotes,
}: {
  taskId: string;
  taskLabel: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const hasNotes = Boolean(initialNotes?.trim());

  function handleSave() {
    startTransition(async () => {
      await updateTaskNotes(taskId, notes.trim() || null);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Note"
        className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-md transition-colors ${
          hasNotes ? "text-[#579bfc] bg-[#579bfc]/10 hover:bg-[#579bfc]/20" : "text-slate-400 hover:bg-slate-100"
        }`}
      >
        <NotebookPen className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note — {taskLabel}</DialogTitle>
          </DialogHeader>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Scrivi qui eventuali annotazioni su questa attività..."
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 resize-none"
          />
          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvataggio..." : "Salva note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

