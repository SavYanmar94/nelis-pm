// ============================================================
// FILE (AGGIORNATO): components/dashboard/project-summary-grid.tsx
// ============================================================

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectSummaryCard } from "./project-summary-card";
import type { ProjectSummary } from "@/lib/types";

export function ProjectSummaryGrid({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3 bg-slate-50/50">
        <p className="text-muted-foreground text-sm">
          Nessun cantiere attivo. Crea il tuo primo progetto per iniziare.
        </p>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crea il primo cantiere
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => (
        <ProjectSummaryCard key={p.id} project={p} />
      ))}
    </div>
  );
}