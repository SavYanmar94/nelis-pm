// ============================================================
// FILE: app/api/projects/[projectId]/verbale/route.tsx
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { VerbaleDocument } from "@/lib/pdf/verbale-document";

// Necessario: @react-pdf/renderer richiede il runtime Node.js (non Edge)
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  let body: { mode?: string; controlType?: string; controlDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido" }, { status: 400 });
  }

  const mode: "completa" | "vuota" = body.mode === "vuota" ? "vuota" : "completa";
  const controlType = body.controlType ?? "";
  const controlDate = body.controlDate ?? new Date().toLocaleDateString("it-IT");

  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("name, client, location")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  }

  let tasks: {
    macro_task: string;
    micro_task: string;
    department: string | null;
    stakeholder: { name: string } | null;
  }[] = [];

  if (mode === "completa") {
    const { data, error } = await supabase
      .from("tasks")
      .select("macro_task, micro_task, department, stakeholder:stakeholders(name)")
      .eq("project_id", projectId)
      .order("fase_macro", { ascending: true })
      .order("fase_micro", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    tasks = (data ?? []) as typeof tasks;
  }

  const buffer = await renderToBuffer(
    <VerbaleDocument
      project={project}
      tasks={tasks}
      mode={mode}
      controlDate={controlDate}
      controlType={controlType}
    />
  );

  const safeName = project.name.replace(/[^a-z0-9]+/gi, "_");
  const filename = `Verbale_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
