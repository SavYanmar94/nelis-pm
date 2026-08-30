// ============================================================
// FILE (NUOVO): components/dashboard/delete-project-button.tsx
// ============================================================

"use client";

import { useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/app/(dashboard)/projects/actions";

export function DeleteProjectButton({
  projectId,
  projectName,
  variant = "badge",
}: {
  projectId: string;
  projectName: string;
  variant?: "badge" | "full";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const conferma = window.confirm(
      `Sei sicuro di voler eliminare il cantiere "${projectName}"?\n\n` +
        "Verranno eliminati definitivamente tutti i task, gli stakeholder collegati e lo storico. " +
        "L'operazione non è reversibile."
    );
    if (!conferma) return;

    startTransition(async () => {
      await deleteProject(projectId);
      router.push("/dashboard");
      router.refresh();
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 text-sm font-semibold text-white bg-[#e2445c] hover:bg-[#c73650] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Eliminazione..." : "Elimina Cantiere"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      {isPending ? "..." : "Elimina cantiere"}
    </button>
  );
}
