// ============================================================
// FILE: app/onboarding/actions.ts
// ============================================================

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Crea l'azienda (Nelis) e rende l'utente corrente "owner" tramite
 * la funzione SQL fn_create_company (SECURITY DEFINER, FASE 1).
 * Nessun redirect qui: il client naviga dopo aver ricevuto companyId.
 */
export async function createCompany(name: string): Promise<{ companyId: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase.rpc("fn_create_company", { p_name: name });

  if (error || !data) {
    throw new Error(error?.message ?? "Errore nella creazione dell'azienda");
  }

  return { companyId: data as unknown as string };
}