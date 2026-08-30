// ============================================================
// FILE (NUOVO): components/settings/account-settings-form.tsx
// ============================================================

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateAccount } from "@/app/(dashboard)/settings/actions";

export function AccountSettingsForm({
  currentName,
  currentEmail,
}: {
  currentName: string;
  currentEmail: string;
}) {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await updateAccount(name, email);
        setMessage(
          email.trim() !== currentEmail
            ? "Nome aggiornato. Controlla la tua casella email per confermare il nuovo indirizzo."
            : "Dati aggiornati con successo."
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore durante l'aggiornamento");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome e cognome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">
              Se cambi email, dovrai confermare il nuovo indirizzo tramite il link che riceverai.
            </p>
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvataggio..." : "Salva modifiche"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}