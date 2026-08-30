// ============================================================
// FILE: app/register/page.tsx
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Crea il tuo account</h1>
          <p className="text-muted-foreground text-sm">Inizia a gestire i cantieri Nelis</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}