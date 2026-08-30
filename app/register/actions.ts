// ============================================================
// FILE (RISCRITTO): app/register/actions.ts
// ============================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: error.message, needsConfirmation: false };

  const needsConfirmation = !data.session;
  return { error: null, needsConfirmation };
}