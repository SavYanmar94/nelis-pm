// ============================================================
// FILE (RISCRITTO): app/(dashboard)/projects/[projectId]/tasks/page.tsx
// Alert rimossi da qui (ora nel tab dedicato)
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProjectWithTasks } from "@/lib/queries/gantt";
import { TaskListView } from "@/components/tasks/task-list-view";
import { VerbaleDialog } from "@/components/verbale/verbale-dialog";
import { ProjectTabs } from "@/components/project/project-tabs";

export default async function ProjectTaskListPage({
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
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
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

      <ProjectTabs projectId={project.id} active="tasks" />

      <TaskListView tasks={tasks} projectId={project.id} />
    </div>
  );
}