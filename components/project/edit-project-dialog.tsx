// ============================================================
// FILE (NUOVO): components/project/edit-project-dialog.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { updateProjectDetails } from "@/app/(dashboard)/projects/actions";
import type { Project } from "@/lib/types";

export function EditProjectDialog({ project }: { project: Project }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client ?? "");
  const [location, setLocation] = useState(project.location ?? "");
  const [startDate, setStartDate] = useState(project.start_date ?? "");
  const [endDate, setEndDate] = useState(project.end_date ?? "");
  const [partitaIva, setPartitaIva] = useState(project.partita_iva ?? "");
  const [codiceFiscale, setCodiceFiscale] = useState(project.codice_fiscale ?? "");
  const [codiceAteco, setCodiceAteco] = useState(project.codice_ateco ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) {
      setError("Il nome del cantiere è obbligatorio.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateProjectDetails(project.id, {
          name: name.trim(),
          client: client.trim() || null,
          location: location.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          partita_iva: partitaIva.trim() || null,
          codice_fiscale: codiceFiscale.trim() || null,
          codice_ateco: codiceAteco.trim() || null,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore durante il salvataggio");
      }
    });
  }

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Modifica Dati Cantiere
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Dati Cantiere</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-name">Nome cantiere *</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-client">Committente</Label>
              <Input id="edit-client" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-location">Indirizzo</Label>
              <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-start">Data inizio</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-end">Data fine</Label>
                <Input id="edit-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-semibold text-slate-700 mb-3">Dati fiscali committente</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-piva">Partita IVA</Label>
                  <Input
                    id="edit-piva"
                    value={partitaIva}
                    onChange={(e) => setPartitaIva(e.target.value)}
                    placeholder="Es. 01234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cf">Codice Fiscale</Label>
                  <Input id="edit-cf" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-ateco">Codice ATECO</Label>
                  <Input
                    id="edit-ateco"
                    value={codiceAteco}
                    onChange={(e) => setCodiceAteco(e.target.value)}
                    placeholder="Es. 41.20.00"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}