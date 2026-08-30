// ============================================================
// FILE (RISCRITTO): components/dashboard/project-summary-card.tsx
// + matita per rinominare nome/committente in linea
// ============================================================

"use client";

import { useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Check, X as XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DeleteProjectButton } from "@/components/dashboard/delete-project-button";
import { updateProjectInfo } from "@/app/(dashboard)/projects/actions";
import type { ProjectSummary, ProjectStatus } from "@/lib/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Bozza",
  active: "Attivo",
  completed: "Completato",
  archived: "Archiviato",
};

export function ProjectSummaryCard({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client ?? "");
  const [, startTransition] = useTransition();

  const overallTone: "red" | "yellow" | "green" =
    project.red_count > 0 ? "red" : project.yellow_count > 0 ? "yellow" : "green";

  const toneRing: Record<typeof overallTone, string> = {
    red: "ring-1 ring-red-200",
    yellow: "ring-1 ring-amber-200",
    green: "ring-1 ring-emerald-200",
  };

  function handleEditClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  }

  function handleSave(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;
    startTransition(async () => {
      await updateProjectInfo(project.id, name.trim(), client.trim() || null);
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleCancel(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setName(project.name);
    setClient(project.client ?? "");
    setIsEditing(false);
  }

  const cardInner = (
    <Card className={`hover:shadow-md transition-shadow h-full ${toneRing[overallTone]} ${!isEditing ? "cursor-pointer" : ""}`}>
      <CardHeader className="pb-2">
        {isEditing ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome cantiere"
              className="text-base font-semibold border border-slate-300 rounded-lg px-2 py-1 w-full"
            />
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Committente"
              className="text-sm border border-slate-300 rounded-lg px-2 py-1 w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Check className="h-3 w-3" /> Salva
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg px-3 py-1.5 transition-colors"
              >
                <XIcon className="h-3 w-3" /> Annulla
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight truncate">{project.name}</CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleEditClick}
                  title="Modifica nome/committente"
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded p-1 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <Badge variant="outline">{STATUS_LABELS[project.status]}</Badge>
              </div>
            </div>
            {project.client && <p className="text-sm text-muted-foreground truncate">{project.client}</p>}
            {project.start_date && (
              <p className="text-xs text-muted-foreground">
                Inizio: {new Date(project.start_date).toLocaleDateString("it-IT")}
              </p>
            )}
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Avanzamento</span>
            <span className="font-medium">{project.progress_percent}%</span>
          </div>
          <Progress value={project.progress_percent} />
          <p className="text-xs text-muted-foreground mt-1">
            {project.completed_tasks} / {project.total_tasks} task completati
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {project.red_count > 0 && (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">🔴 {project.red_count}</Badge>
          )}
          {project.yellow_count > 0 && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">🟡 {project.yellow_count}</Badge>
          )}
          {project.red_count === 0 && project.yellow_count === 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">🟢 In regola</Badge>
          )}
          <DeleteProjectButton projectId={project.id} projectName={project.name} variant="badge" />
        </div>
      </CardContent>
    </Card>
  );

  if (isEditing) {
    return <div>{cardInner}</div>;
  }

  return <Link href={`/projects/${project.id}/alerts`}>{cardInner}</Link>;
}