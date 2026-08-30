// ============================================================
// FILE: app/onboarding/page.tsx
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
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

  // Già onboardato: vai direttamente alla dashboard
  if (membership) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Benvenuto in Nelis PM</h1>
          <p className="text-muted-foreground">
            Prima di iniziare, crea la tua azienda per gestire cantieri e collaboratori.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}