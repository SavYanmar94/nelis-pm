// ============================================================
// FILE (RISCRITTO): app/(dashboard)/projects/new/page.tsx
// + fetch dei rolePresets
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectWizard } from "@/components/wizard/project-wizard";

export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const [{ data: templates }, { data: stakeholders }, { data: rolePresets }] = await Promise.all([
    supabase
      .from("project_templates")
      .select("*")
      .or(`company_id.is.null,company_id.eq.${membership.company_id}`)
      .order("title"),
    supabase
      .from("stakeholders")
      .select("*")
      .eq("company_id", membership.company_id)
      .order("name"),
    supabase
      .from("role_presets")
      .select("*")
      .or(`company_id.is.null,company_id.eq.${membership.company_id}`)
      .order("label"),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Nuovo Cantiere</h1>
      <ProjectWizard
        companyId={membership.company_id}
        templates={templates ?? []}
        existingStakeholders={stakeholders ?? []}
        rolePresets={rolePresets ?? []}
      />
    </div>
  );
}
