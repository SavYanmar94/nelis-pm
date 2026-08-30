// ============================================================
// FILE: components/auth/logout-button.tsx
// ============================================================

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(dashboard)/dashboard/actions";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-2 text-muted-foreground"
    >
      <LogOut className="h-4 w-4" />
      Esci
    </Button>
  );
}
