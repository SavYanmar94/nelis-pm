// ============================================================
// FILE: components/wizard/step-2-template-selection.tsx
// ============================================================

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { ProjectTemplate } from "@/lib/types";

export function StepTemplateSelection({
  templates,
  selectedTemplateId,
  onSelect,
}: {
  templates: ProjectTemplate[];
  selectedTemplateId: string | null;
  onSelect: (template: ProjectTemplate | null) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Scegli un template per pre-popolare le fasi di lavoro, oppure parti da zero.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            title={t.title}
            subtitle={`${t.default_tasks_json.length} fasi pre-configurate`}
            selected={selectedTemplateId === t.id}
            onClick={() => onSelect(t)}
          />
        ))}
        <TemplateCard
          title="Personalizzato da zero"
          subtitle="Costruisci la WBS manualmente"
          selected={selectedTemplateId === null}
          onClick={() => onSelect(null)}
        />
      </div>
    </div>
  );
}

function TemplateCard({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-colors ${
        selected ? "border-primary ring-2 ring-primary/30" : "hover:border-muted-foreground/40"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {selected && <Check className="h-5 w-5 text-primary" />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}