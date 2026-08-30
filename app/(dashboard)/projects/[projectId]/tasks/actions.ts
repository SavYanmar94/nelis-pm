// ============================================================
// FILE (RISCRITTO): app/(dashboard)/projects/[projectId]/tasks/actions.ts
// + gestione completa Fasi/Micro-Fasi, date pianificate, blocco
// ============================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/alerts`);
  revalidatePath("/dashboard");
}

export async function toggleTaskField(
  taskId: string,
  field: "is_scheduled" | "is_completed" | "is_blocking",
  value: boolean
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ [field]: value })
    .eq("id", taskId)
    .select("project_id")
    .single();

  if (error) throw new Error(error.message);
  if (data) revalidateProject(data.project_id);
}

export async function updateTaskDate(
  taskId: string,
  field: "actual_start" | "actual_end" | "planned_start" | "planned_end",
  value: string | null
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ [field]: value })
    .eq("id", taskId)
    .select("project_id")
    .single();

  if (error) throw new Error(error.message);
  if (data) revalidateProject(data.project_id);
}

export async function updateTaskPredecessor(taskId: string, predecessorId: string | null) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ predecessor_task_id: predecessorId })
    .eq("id", taskId)
    .select("project_id")
    .single();

  if (error) throw new Error(error.message);
  if (data) revalidateProject(data.project_id);
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("project_id")
    .single();

  if (error) throw new Error(error.message);
  if (data) revalidateProject(data.project_id);
}

export async function addTaskToGroup(
  projectId: string,
  faseMacro: number,
  macroTask: string,
  faseMicro: number,
  microTask: string,
  input: { name: string; role: string; email: string | null }
): Promise<string> {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) throw new Error("Progetto non trovato");

  const { data: stakeholder, error: stakeholderError } = await supabase
    .from("stakeholders")
    .insert({
      company_id: project.company_id,
      name: input.name,
      role: input.role,
      organization_type: "Tecnico",
      email: input.email,
    })
    .select()
    .single();

  if (stakeholderError || !stakeholder) {
    throw new Error(stakeholderError?.message ?? "Errore nella creazione del contatto");
  }

  const { error: linkError } = await supabase.from("project_stakeholders").upsert(
    { project_id: projectId, stakeholder_id: stakeholder.id, custom_role: input.role },
    { onConflict: "project_id,stakeholder_id" }
  );

  if (linkError) throw new Error(linkError.message);

  const nextSortOrder = await getNextSortOrder(supabase, projectId);

  const { data: newTask, error: taskError } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      fase_macro: faseMacro,
      macro_task: macroTask,
      fase_micro: faseMicro,
      micro_task: microTask,
      department: input.role,
      assigned_stakeholder_id: stakeholder.id,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (taskError || !newTask) throw new Error(taskError?.message ?? "Errore nella creazione del task");

  revalidateProject(projectId);
  return newTask.id;
}

/** Rinomina/rinumera una Fase su tutti i task che la condividono */
export async function renameMacroTask(
  projectId: string,
  oldFaseMacro: number,
  oldMacroTask: string,
  newFaseMacro: number,
  newMacroTask: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ fase_macro: newFaseMacro, macro_task: newMacroTask })
    .eq("project_id", projectId)
    .eq("fase_macro", oldFaseMacro)
    .eq("macro_task", oldMacroTask);

  if (error) throw new Error(error.message);
  revalidateProject(projectId);
}

/** Rinomina/rinumera una Micro-Fase su tutti i task che la condividono */
export async function renameMicroTask(
  projectId: string,
  faseMacro: number,
  macroTask: string,
  oldFaseMicro: number,
  oldMicroTask: string,
  newFaseMicro: number,
  newMicroTask: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ fase_micro: newFaseMicro, micro_task: newMicroTask })
    .eq("project_id", projectId)
    .eq("fase_macro", faseMacro)
    .eq("macro_task", macroTask)
    .eq("fase_micro", oldFaseMicro)
    .eq("micro_task", oldMicroTask);

  if (error) throw new Error(error.message);
  revalidateProject(projectId);
}

/** Elimina una Fase intera e tutti i task che contiene */
export async function deleteMacroTaskGroup(projectId: string, faseMacro: number, macroTask: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("project_id", projectId)
    .eq("fase_macro", faseMacro)
    .eq("macro_task", macroTask);

  if (error) throw new Error(error.message);
  revalidateProject(projectId);
}

/** Elimina una Micro-Fase intera e tutti i task che contiene */
export async function deleteMicroTaskGroup(
  projectId: string,
  faseMacro: number,
  macroTask: string,
  faseMicro: number,
  microTask: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("project_id", projectId)
    .eq("fase_macro", faseMacro)
    .eq("macro_task", macroTask)
    .eq("fase_micro", faseMicro)
    .eq("micro_task", microTask);

  if (error) throw new Error(error.message);
  revalidateProject(projectId);
}

/** Crea una nuova Fase con una Micro-Fase segnaposto (necessario: senza righe non esisterebbe nel DB) */
export async function addMacroTaskGroup(
  projectId: string,
  faseMacro: number,
  macroTask: string
): Promise<string> {
  const supabase = await createClient();
  const nextSortOrder = await getNextSortOrder(supabase, projectId);

  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      fase_macro: faseMacro,
      macro_task: macroTask,
      fase_micro: 0,
      micro_task: "Nuova micro-fase",
      department: "",
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error || !newTask) throw new Error(error?.message ?? "Errore nella creazione della fase");
  revalidateProject(projectId);
  return newTask.id;
}

/** Crea una nuova Micro-Fase con un task segnaposto */
export async function addMicroTaskGroup(
  projectId: string,
  faseMacro: number,
  macroTask: string,
  faseMicro: number,
  microTask: string
): Promise<string> {
  const supabase = await createClient();
  const nextSortOrder = await getNextSortOrder(supabase, projectId);

  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      fase_macro: faseMacro,
      macro_task: macroTask,
      fase_micro: faseMicro,
      micro_task: microTask,
      department: "",
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error || !newTask) throw new Error(error?.message ?? "Errore nella creazione della micro-fase");
  revalidateProject(projectId);
  return newTask.id;
}

async function getNextSortOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
): Promise<number> {
  const { data: maxRow } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (maxRow?.sort_order ?? 0) + 1;
}
