// ============================================================
// FILE (RISCRITTO): app/(dashboard)/projects/[projectId]/gantt/page.tsx
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProjectWithTasks } from "@/lib/queries/gantt";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { VerbaleDialog } from "@/components/verbale/verbale-dialog";
import { ProjectTabs } from "@/components/project/project-tabs";
import { RefreshButton } from "@/components/gantt/refresh-button";

export default async function ProjectGanttPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const result = await getProjectWithTasks(supabase, projectId);
  if (!result) notFound();
  const { project, tasks } = result;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla dashboard
      </Link>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{project.name}</h1>
          {project.client && <p className="text-muted-foreground">{project.client}</p>}
        </div>
        <VerbaleDialog projectId={project.id} />
      </header>

      <ProjectTabs projectId={project.id} active="gantt" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Se hai appena modificato dei task, aggiorna per vedere le modifiche
        </p>
        <RefreshButton />
      </div>

      <GanttChart project={project} tasks={tasks} />
    </div>
  );
}