// ============================================================
// NELIS PM — FASE 7 (bonus): Autenticazione — login, registrazione, logout
// ============================================================


// ============================================================
// FILE: app/page.tsx
// ============================================================

import { redirect } from "next/navigation";

export default function Home() {
  // La dashboard gestisce già lo smistamento verso /login o /onboarding
  redirect("/dashboard");
}