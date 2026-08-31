// ============================================================
// FILE (RISCRITTO): app/(dashboard)/projects/[projectId]/alerts/page.tsx
// + pulsante "Modifica Dati Cantiere"
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProjectWithTasks, getProjectAlerts } from "@/lib/queries/gantt";
import { VerbaleDialog } from "@/components/verbale/verbale-dialog";
import { EditProjectDialog } from "@/components/project/edit-project-dialog";
import { ProjectTabs } from "@/components/project/project-tabs";
import { MorningDigestWidget } from "@/components/dashboard/morning-digest";
import { DeleteProjectButton } from "@/components/dashboard/delete-project-button";

export default async function ProjectAlertsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const result = await getProjectWithTasks(supabase, projectId);
  if (!result) notFound();
  const { project } = result;

  const alerts = await getProjectAlerts(supabase, projectId);

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
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <EditProjectDialog project={project} />
            <VerbaleDialog projectId={project.id} />
          </div>
          <DeleteProjectButton projectId={project.id} projectName={project.name} variant="full" />
        </div>
      </header>

      <ProjectTabs projectId={project.id} active="alerts" />

      <MorningDigestWidget red={alerts.red} yellow={alerts.yellow} />
    </div>
  );
}