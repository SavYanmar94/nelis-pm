// ============================================================
// FILE (RISCRITTO): components/verbale/verbale-dialog.tsx
// Fix: rimosso DialogTrigger/asChild (causava <button> annidato).
// Il Dialog è già controllato via stato "open", quindi il bottone
// esterno può semplicemente chiamare setOpen(true).
// ============================================================

"use client";

import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function VerbaleDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"completa" | "vuota">("completa");
  const [controlType, setControlType] = useState("");
  const [controlDate, setControlDate] = useState(() => new Date().toLocaleDateString("it-IT"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/verbale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, controlType, controlDate }),
      });

      if (!res.ok) throw new Error("Errore nella generazione del PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Verbale_${controlDate.replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" />
        Genera Verbale
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verbale di Controllo Cantiere</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Tipo di documento</Label>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as "completa" | "vuota")}
                className="mt-2 space-y-2"
              >
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="completa" />
                  Completo — con la WBS del cantiere pre-compilata
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="vuota" />
                  Vuoto — 20 righe da compilare manualmente
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="controlDate">Data controllo</Label>
              <Input
                id="controlDate"
                value={controlDate}
                onChange={(e) => setControlDate(e.target.value)}
                placeholder="gg/mm/aaaa"
              />
            </div>

            <div>
              <Label htmlFor="controlType">Tipo di controllo</Label>
              <Input
                id="controlType"
                value={controlType}
                onChange={(e) => setControlType(e.target.value)}
                placeholder="Es. Sopralluogo settimanale"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleDownload} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isLoading ? "Generazione..." : "Scarica PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
