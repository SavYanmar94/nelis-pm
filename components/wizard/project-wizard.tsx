// ============================================================
// FILE (RISCRITTO): components/wizard/project-wizard.tsx
// + accetta e propaga rolePresets
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StepBasicInfo } from "./step-1-basic-info";
import { StepTemplateSelection } from "./step-2-template-selection";
import { StepWbsTasks, templateToWbsGroups, flattenWbsGroups, type WbsMacroGroup } from "./step-3-wbs-tasks";
import { createProject } from "@/app/(dashboard)/projects/actions";
import type {
  ProjectTemplate,
  Stakeholder,
  RolePreset,
  WizardStep1Input,
  CreateProjectPayload,
} from "@/lib/types";

const STEP_LABELS = ["Dati base", "Template", "WBS"];

interface ProjectWizardProps {
  companyId: string;
  templates: ProjectTemplate[];
  existingStakeholders: Stakeholder[];
  rolePresets: RolePreset[];
}

export function ProjectWizard({ companyId, templates, existingStakeholders, rolePresets }: ProjectWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<WizardStep1Input>({
    name: "",
    client: "",
    location: "",
    start_date: "",
    end_date: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [wbsGroups, setWbsGroups] = useState<WbsMacroGroup[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");

  function handleSelectTemplate(template: ProjectTemplate | null) {
    setSelectedTemplate(template);
    setWbsGroups(template ? templateToWbsGroups(template.default_tasks_json) : []);
  }

  function canGoNext(): boolean {
    if (step === 1) return basicInfo.name.trim().length > 0;
    if (step === 3) return wbsGroups.some((m) => m.microGroups.some((mi) => mi.rows.length > 0));
    return true;
  }

  function handleCancel() {
    const conferma = window.confirm(
      "Sei sicuro di voler tornare alla dashboard? I dati inseriti in questo wizard andranno persi."
    );
    if (conferma) {
      router.push("/dashboard");
    }
  }

  function handleSubmit() {
    setError(null);

    const payload: CreateProjectPayload = {
      companyId,
      basicInfo,
      templateId: selectedTemplate?.id ?? null,
      tasks: flattenWbsGroups(wbsGroups),
      saveAsTemplate:
        saveAsTemplate && templateTitle.trim()
          ? { title: templateTitle.trim(), category: selectedTemplate?.category ?? "Personalizzato" }
          : null,
    };

    startTransition(async () => {
      try {
        const { projectId } = await createProject(payload);
        router.push(`/projects/${projectId}/alerts`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore durante la creazione del progetto");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Annulla e torna alla dashboard
        </button>
      </div>

      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === step;
          const isDone = stepNumber < step;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
              {stepNumber < STEP_LABELS.length && <div className="flex-1 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        {step === 1 && <StepBasicInfo value={basicInfo} onChange={setBasicInfo} />}

        {step === 2 && (
          <StepTemplateSelection
            templates={templates}
            selectedTemplateId={selectedTemplate?.id ?? null}
            onSelect={handleSelectTemplate}
          />
        )}

        {step === 3 && (
          <StepWbsTasks
            groups={wbsGroups}
            onChange={setWbsGroups}
            existingStakeholders={existingStakeholders}
            rolePresets={rolePresets}
            saveAsTemplate={saveAsTemplate}
            onToggleSaveAsTemplate={setSaveAsTemplate}
            templateTitle={templateTitle}
            onTemplateTitleChange={setTemplateTitle}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </p>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || isPending}
        >
          Indietro
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={!canGoNext()}>
            Avanti
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending || !canGoNext()}>
            {isPending ? "Creazione in corso..." : "Crea Cantiere"}
          </Button>
        )}
      </div>
    </div>
  );
}