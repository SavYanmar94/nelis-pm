// ============================================================
// FILE (RISCRITTO): app/(dashboard)/projects/actions.ts
// ============================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateProjectPayload } from "@/lib/types";

export async function createProject(
  payload: CreateProjectPayload
): Promise<{ projectId: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autenticato");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      company_id: payload.companyId,
      name: payload.basicInfo.name,
      client: payload.basicInfo.client || null,
      location: payload.basicInfo.location || null,
      start_date: payload.basicInfo.start_date || null,
      end_date: payload.basicInfo.end_date || null,
      template_used: payload.templateId,
      created_by: user.id,
      status: "active",
      partita_iva: payload.basicInfo.partita_iva || null,
      codice_fiscale: payload.basicInfo.codice_fiscale || null,
      codice_ateco: payload.basicInfo.codice_ateco || null,
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Errore nella creazione del progetto");
  }

  // Evita di creare due volte lo stesso "nuovo" contatto se compare su più righe in questo submit
  const newStakeholderCache = new Map<string, string>();
  const tasksToInsert = [];
  let sortOrder = 0;

  for (const t of payload.tasks) {
    let stakeholderId: string | null = t.stakeholder_id;

    if (!stakeholderId && t.stakeholder_name && t.stakeholder_name.trim()) {
      const cacheKey = `${t.stakeholder_name.trim().toLowerCase()}|${(t.stakeholder_email ?? "")
        .trim()
        .toLowerCase()}`;

      if (newStakeholderCache.has(cacheKey)) {
        stakeholderId = newStakeholderCache.get(cacheKey)!;
      } else {
        const { data: newStakeholder, error: sErr } = await supabase
          .from("stakeholders")
          .insert({
            company_id: payload.companyId,
            name: t.stakeholder_name.trim(),
            role: t.department || "",
            organization_type: "Tecnico",
            email: t.stakeholder_email?.trim() || null,
          })
          .select()
          .single();

        if (sErr || !newStakeholder) {
          throw new Error(sErr?.message ?? "Errore nella creazione del contatto");
        }
        stakeholderId = newStakeholder.id;
        newStakeholderCache.set(cacheKey, stakeholderId);
      }
    }

    if (stakeholderId) {
      const { error: linkError } = await supabase
        .from("project_stakeholders")
        .upsert(
          { project_id: project.id, stakeholder_id: stakeholderId, custom_role: t.department },
          { onConflict: "project_id,stakeholder_id" }
        );
      if (linkError) throw new Error(linkError.message);
    }

    tasksToInsert.push({
      project_id: project.id,
      fase_macro: t.fase_macro,
      macro_task: t.macro_task,
      fase_micro: t.fase_micro,
      micro_task: t.micro_task,
      department: t.department,
      planned_start: t.planned_start,
      planned_end: t.planned_end,
      is_blocking: t.is_blocking,
      assigned_stakeholder_id: stakeholderId,
      sort_order: sortOrder++,
    });
  }

  if (tasksToInsert.length > 0) {
    const { error: tasksError } = await supabase.from("tasks").insert(tasksToInsert);
    if (tasksError) throw new Error(tasksError.message);
  }

  if (payload.saveAsTemplate) {
    const grouped = groupTasksForTemplate(payload.tasks);
    const { error: templateError } = await supabase.from("project_templates").insert({
      company_id: payload.companyId,
      title: payload.saveAsTemplate.title,
      category: payload.saveAsTemplate.category,
      default_tasks_json: grouped,
    });
    if (templateError) throw new Error(templateError.message);
  }

  revalidatePath("/dashboard");
  return { projectId: project.id };
}

function groupTasksForTemplate(tasks: CreateProjectPayload["tasks"]) {
  const map = new Map<
    string,
    { fase_macro: number; macro_task: string; fase_micro: number; micro_task: string; departments: string[] }
  >();

  for (const t of tasks) {
    const key = `${t.fase_macro}-${t.macro_task}-${t.fase_micro}-${t.micro_task}`;
    if (!map.has(key)) {
      map.set(key, {
        fase_macro: t.fase_macro,
        macro_task: t.macro_task,
        fase_micro: t.fase_micro,
        micro_task: t.micro_task,
        departments: [],
      });
    }
    map.get(key)!.departments.push(t.department);
  }

  return Array.from(map.values());
}

// ============================================================
// FILE (AGGIORNATO): app/(dashboard)/projects/actions.ts
// + deleteProject (aggiunta alla fine del file esistente)
// ============================================================

/*
  Aggiungi questa funzione in fondo al file esistente
  app/(dashboard)/projects/actions.ts (che contiene già createProject):
*/

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

// ============================================================
// FILE (AGGIORNATO): app/(dashboard)/projects/actions.ts
// + updateProjectInfo (aggiungi in fondo al file esistente)
// ============================================================

/*
  Aggiungi questa funzione in fondo al file esistente
  app/(dashboard)/projects/actions.ts:
*/

export async function updateProjectInfo(projectId: string, name: string, client: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ name, client }).eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/alerts`);
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/tasks`);
}

/*
Poi aggiungi questa nuova funzione in fondo al file
(distinta da updateProjectInfo, che resta invariata e continua
a gestire la rinomina rapida dalla dashboard):
*/

export interface UpdateProjectDetailsInput {
  name: string;
  client: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  partita_iva: string | null;
  codice_fiscale: string | null;
  codice_ateco: string | null;
}

export async function updateProjectDetails(projectId: string, data: UpdateProjectDetailsInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(data).eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/alerts`);
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/tasks`);
}