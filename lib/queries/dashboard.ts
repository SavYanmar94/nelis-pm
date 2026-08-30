// ============================================================
// FILE (RISCRITTO): lib/queries/dashboard.ts
// DigestNotification arricchita con dati tecnico (nome/ruolo/email)
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationType, ProjectSummary } from "@/lib/types";

export interface DigestNotification {
  id: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
  project_id: string;
  task_id: string;
  task: {
    fase_macro: number;
    macro_task: string;
    fase_micro: number;
    micro_task: string;
    planned_end: string | null;
    department: string | null;
    stakeholder: { name: string; role: string; email: string | null } | null;
  } | null;
  project: {
    name: string;
  } | null;
}

export interface MorningDigest {
  red: DigestNotification[];
  yellow: DigestNotification[];
  redCount: number;
  yellowCount: number;
}

export async function getMorningDigest(
  supabase: SupabaseClient<Database>
): Promise<MorningDigest> {
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
    .order("created_at", { ascending: false })
    .returns<DigestNotification[]>();

  if (error) throw error;

  const all = data ?? [];
  const red = all.filter((n) => n.type === "RED");
  const yellow = all.filter((n) => n.type === "YELLOW");

  return { red, yellow, redCount: red.length, yellowCount: yellow.length };
}

export async function getProjectSummaries(
  supabase: SupabaseClient<Database>
): Promise<ProjectSummary[]> {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .neq("status", "archived")
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) throw error;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const [{ data: progressRows }, { data: notifRows }] = await Promise.all([
    supabase.from("project_progress").select("*").in("project_id", projectIds),
    supabase.from("notifications").select("project_id, type").in("project_id", projectIds),
  ]);

  const progressMap = new Map((progressRows ?? []).map((r) => [r.project_id, r]));

  const counts = new Map<string, { red: number; yellow: number }>();
  (notifRows ?? []).forEach((n) => {
    const c = counts.get(n.project_id) ?? { red: 0, yellow: 0 };
    if (n.type === "RED") c.red++;
    else c.yellow++;
    counts.set(n.project_id, c);
  });

  return projects.map((p) => {
    const progress = progressMap.get(p.id);
    const c = counts.get(p.id) ?? { red: 0, yellow: 0 };
    return {
      ...p,
      progress_percent: progress?.progress_percent ?? 0,
      total_tasks: progress?.total_tasks ?? 0,
      completed_tasks: progress?.completed_tasks ?? 0,
      red_count: c.red,
      yellow_count: c.yellow,
    };
  });
}
