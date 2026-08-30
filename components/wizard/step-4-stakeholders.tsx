// ============================================================
// FILE: components/wizard/step-4-stakeholders.tsx
// ============================================================

"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Stakeholder, WizardStakeholderInput, OrganizationType, WizardTaskDraft } from "@/lib/types";

const ORG_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "Tecnico", label: "Tecnico" },
  { value: "Ente_Pubblico", label: "Ente Pubblico" },
  { value: "Impresa", label: "Impresa" },
];

interface StepStakeholdersProps {
  tasks: WizardTaskDraft[];
  existingStakeholders: Stakeholder[];
  assignments: Record<string, WizardStakeholderInput>;
  onChange: (assignments: Record<string, WizardStakeholderInput>) => void;
}

export function StepStakeholders({
  tasks,
  existingStakeholders,
  assignments,
  onChange,
}: StepStakeholdersProps) {
  const departments = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.department).filter(Boolean))),
    [tasks]
  );

  function updateAssignment(department: string, patch: Partial<WizardStakeholderInput>) {
    const current: WizardStakeholderInput = assignments[department] ?? {
      name: "",
      role: department,
      organization_type: "Tecnico",
      email: "",
      phone: "",
    };
    onChange({ ...assignments, [department]: { ...current, ...patch } });
  }

  function selectExisting(department: string, stakeholderId: string) {
    const existing = existingStakeholders.find((s) => s.id === stakeholderId);
    if (!existing) return;
    onChange({
      ...assignments,
      [department]: {
        stakeholder_id: existing.id,
        name: existing.name,
        role: existing.role,
        organization_type: existing.organization_type,
        email: existing.email ?? "",
        phone: existing.phone ?? "",
      },
    });
  }

  if (departments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessun reparto/figura definito nella WBS. Torna al passo precedente per aggiungerne.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Per ogni figura coinvolta, seleziona un contatto già in anagrafica oppure inserisci i dati
        di un nuovo collaboratore.
      </p>

      {departments.map((dept) => {
        const a = assignments[dept];
        return (
          <Card key={dept}>
            <CardContent className="pt-4 space-y-3">
              <p className="font-medium">{dept}</p>

              {existingStakeholders.length > 0 && (
                <div>
                  <Label>Contatto esistente</Label>
                  <Select onValueChange={(v) => selectExisting(dept, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona o inserisci nuovo contatto sotto" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingStakeholders.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {s.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome / Ragione sociale</Label>
                  <Input
                    value={a?.name ?? ""}
                    onChange={(e) =>
                      updateAssignment(dept, { name: e.target.value, stakeholder_id: undefined })
                    }
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={a?.organization_type ?? "Tecnico"}
                    onValueChange={(v) => updateAssignment(dept, { organization_type: v as OrganizationType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={a?.email ?? ""}
                    onChange={(e) => updateAssignment(dept, { email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input
                    value={a?.phone ?? ""}
                    onChange={(e) => updateAssignment(dept, { phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}