// ============================================================
// FILE: components/auth/login-form.tsx
// ============================================================

"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signIn } from "@/app/login/actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn(email, password);
      if (result.error) {
        setError(traduciErrore(result.error));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground text-center mt-4">
          Non hai un account?{" "}
          <Link href="/register" className="text-primary underline underline-offset-4">
            Registrati
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function traduciErrore(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o password non corretti.";
  if (message.includes("Email not confirmed")) return "Devi confermare l'email prima di accedere.";
  return message;
}
