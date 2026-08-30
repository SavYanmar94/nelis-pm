// ============================================================
// FILE (RISCRITTO): components/auth/register-form.tsx
// ============================================================

"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signUp } from "@/app/register/actions";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Inserisci il tuo nome e cognome.");
      return;
    }
    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }

    startTransition(async () => {
      const result = await signUp(name.trim(), email, password);
      if (result.error) {
        setError(traduciErrore(result.error));
        return;
      }
      if (result.needsConfirmation) {
        setConfirmationSent(true);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    });
  }

  if (confirmationSent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-2">
          <p className="font-medium">Controlla la tua casella email 📬</p>
          <p className="text-sm text-muted-foreground">
            Ti abbiamo inviato un link di conferma a <strong>{email}</strong>. Clicca sul link per
            attivare l&apos;account, poi torna qui per accedere.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome e cognome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Es. Saverio Mercante"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creazione account..." : "Crea account"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground text-center mt-4">
          Hai già un account?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Accedi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function traduciErrore(message: string): string {
  if (message.includes("already registered")) return "Esiste già un account con questa email.";
  return message;
}