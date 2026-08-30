// ============================================================
// FILE: components/onboarding/onboarding-form.tsx
// ============================================================

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCompany } from "@/app/onboarding/actions";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("Nelis");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Inserisci il nome della tua azienda");
      return;
    }

    startTransition(async () => {
      try {
        await createCompany(name.trim());
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore imprevisto");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Nome azienda</Label>
            <Input
              id="companyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Nelis Srl"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creazione in corso..." : "Crea azienda e continua"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}