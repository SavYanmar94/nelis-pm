// ============================================================
// FILE (NUOVO): app/(dashboard)/settings/actions.ts
// ============================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAccount(name: string, email: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autenticato");

  const updates: { email?: string; data?: { full_name: string } } = {};
  if (name.trim()) updates.data = { full_name: name.trim() };
  if (email.trim() && email.trim() !== user.email) updates.email = email.trim();

  const { error } = await supabase.auth.updateUser(updates);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function addRolePreset(companyId: string, label: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("role_presets").insert({ company_id: companyId, label });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateRolePreset(id: string, label: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("role_presets").update({ label }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteRolePreset(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("role_presets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
