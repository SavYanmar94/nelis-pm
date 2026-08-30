// ============================================================
// FILE (RISCRITTO): app/(dashboard)/dashboard/page.tsx
// + link Impostazioni nell'header
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMorningDigest, getProjectSummaries } from "@/lib/queries/dashboard";
import { MorningDigestWidget } from "@/components/dashboard/morning-digest";
import { ProjectSearch } from "@/components/dashboard/project-search";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { DailyQuote } from "@/components/dashboard/daily-quote";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const [digest, projects] = await Promise.all([
    getMorningDigest(supabase),
    getProjectSummaries(supabase),
  ]);

  const fullName = (user!.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = fullName.trim().split(" ")[0] ?? "";

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <GreetingHeader firstName={firstName} />
        <div className="flex items-center gap-2">
          <Link href="/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Cantiere
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="icon" title="Impostazioni">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <DailyQuote />

      <MorningDigestWidget red={digest.red} yellow={digest.yellow} />

      <section>
        <h2 className="text-xl font-semibold mb-4">I tuoi cantieri</h2>
        <ProjectSearch projects={projects} />
      </section>
    </div>
  );
}