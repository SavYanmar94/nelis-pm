// ============================================================
// FILE: lib/supabase/server.ts
// Client Supabase per Server Components / Server Actions / Route Handlers
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // setAll chiamato da un Server Component: ignorabile
            // se hai il middleware che rinfresca le sessioni (vedi sotto).
          }
        },
      },
    }
  );
}

/**
 * Client con service_role, da usare SOLO in contesti server-side sicuri
 * (es. cron job, Edge Functions) per bypassare RLS quando necessario.
 * NON esporre mai la service_role key al client.
 */
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}