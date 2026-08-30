// ============================================================
// FILE (RISCRITTO): lib/queries/gantt.ts
// getProjectAlerts allineata alla stessa select arricchita
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Project, TaskWithStakeholder } from "@/lib/types";
import type { DigestNotification } from "@/lib/queries/dashboard";

export async function getProjectWithTasks(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<{ project: Project; tasks: TaskWithStakeholder[] } | null> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) return null;

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select(
      `
      *,
      stakeholder:stakeholders ( id, name, role, email, phone )
    `
    )
    .eq("project_id", projectId)
    .order("fase_macro", { ascending: true })
    .order("fase_micro", { ascending: true })
    .order("sort_order", { ascending: true })
    .returns<TaskWithStakeholder[]>();

  if (tasksError) throw new Error(tasksError.message);

  return { project, tasks: tasks ?? [] };
}

export async function getProjectAlerts(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<{ red: DigestNotification[]; yellow: DigestNotification[] }> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id, type, message, is_read, created_at, project_id, task_id,
      task:tasks (
        fase_macro, macro_task, fase_micro, micro_task, planned_end, department,
        stakeholder:stakeholders ( name, role, email )
      ),
      project:projects ( name )
    `
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<DigestNotification[]>();

  if (error) throw error;

  const all = data ?? [];
  return {
    red: all.filter((n) => n.type === "RED"),
    yellow: all.filter((n) => n.type === "YELLOW"),
  };
}

