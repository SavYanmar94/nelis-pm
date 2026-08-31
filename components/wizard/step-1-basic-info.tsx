// ============================================================
// FILE (RISCRITTO): components/wizard/step-1-basic-info.tsx
// ============================================================

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardStep1Input } from "@/lib/types";

export function StepBasicInfo({
  value,
  onChange,
}: {
  value: WizardStep1Input;
  onChange: (value: WizardStep1Input) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome cantiere *</Label>
        <Input
          id="name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Es. Ristrutturazione Via Roma 12"
        />
      </div>
      <div>
        <Label htmlFor="client">Cliente</Label>
        <Input
          id="client"
          value={value.client}
          onChange={(e) => onChange({ ...value, client: e.target.value })}
          placeholder="Nome del committente"
        />
      </div>
      <div>
        <Label htmlFor="location">Indirizzo</Label>
        <Input
          id="location"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          placeholder="Via, città"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Data inizio stimata</Label>
          <Input
            id="start_date"
            type="date"
            value={value.start_date}
            onChange={(e) => onChange({ ...value, start_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="end_date">Data fine stimata</Label>
          <Input
            id="end_date"
            type="date"
            value={value.end_date}
            onChange={(e) => onChange({ ...value, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-2 border-t">
        <p className="text-sm font-semibold text-slate-700 mb-3">Dati fiscali committente (opzionali)</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="partita_iva">Partita IVA</Label>
            <Input
              id="partita_iva"
              value={value.partita_iva}
              onChange={(e) => onChange({ ...value, partita_iva: e.target.value })}
              placeholder="Es. 01234567890"
            />
          </div>
          <div>
            <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
            <Input
              id="codice_fiscale"
              value={value.codice_fiscale}
              onChange={(e) => onChange({ ...value, codice_fiscale: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="codice_ateco">Codice ATECO</Label>
            <Input
              id="codice_ateco"
              value={value.codice_ateco}
              onChange={(e) => onChange({ ...value, codice_ateco: e.target.value })}
              placeholder="Es. 41.20.00"
            />
          </div>
        </div>
      </div>
    </div>
  );
}