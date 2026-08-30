// ============================================================
// FILE (NUOVO): app/(dashboard)/settings/page.tsx
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { RolePresetsManager } from "@/components/settings/role-presets-manager";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: rolePresets } = await supabase
    .from("role_presets")
    .select("*")
    .or(`company_id.is.null,company_id.eq.${membership.company_id}`)
    .order("label");

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Impostazioni</h1>
        <p className="text-muted-foreground text-sm">Gestisci il tuo account e i dati condivisi tra i cantieri</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Il tuo account</h2>
        <AccountSettingsForm currentName={fullName} currentEmail={user.email ?? ""} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Ruoli e reparti</h2>
        <p className="text-sm text-muted-foreground">
          Questi ruoli compaiono nel menu a tendina "Ruolo comune" quando crei un nuovo cantiere.
        </p>
        <RolePresetsManager companyId={membership.company_id} presets={rolePresets ?? []} />
      </section>
    </div>
  );
}

