"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Segna una notifica come "vista" (non la elimina: sparirà da sola quando il task viene risolto) */
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

/**
 * Forza il ricalcolo di tutte le notifiche (equivalente al refresh giornaliero
 * schedulato via pg_cron). Usa la service_role perché la funzione SQL è
 * concessa solo a quel ruolo — va bene, gira lato server in una Server Action.
 */
export async function refreshNotificationsNow() {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("fn_refresh_all_notifications");
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

/** Disconnette l'utente corrente (usata da components/auth/logout-button.tsx) */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}