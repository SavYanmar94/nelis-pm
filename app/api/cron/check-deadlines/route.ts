// ============================================================
// FILE (NUOVO): app/api/cron/check-deadlines/route.ts
// Endpoint chiamato automaticamente da Vercel Cron ogni giorno
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resend } from "@/lib/email/resend";
import { buildDeadlineReminderEmail } from "@/lib/email/deadline-reminder-template";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Protegge l'endpoint: solo Vercel Cron (che invia questo header) può eseguirlo
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
      id, micro_task, macro_task, planned_end,
      project:projects ( name ),
      stakeholder:stakeholders ( name, email )
    `
    )
    .eq("planned_end", tomorrowStr)
    .eq("is_completed", false);

  if (error) {
    console.error("Errore query task in scadenza:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  let sent = 0;
  let skipped = 0;

  for (const task of tasks ?? []) {
    const email = task.stakeholder?.email;
    if (!email) {
      skipped++;
      continue;
    }

    try {
      await resend.emails.send({
        from: `Nelis PM <${fromEmail}>`,
        to: email,
        subject: `⏰ Promemoria scadenza - ${task.micro_task}`,
        html: buildDeadlineReminderEmail({
          microTask: task.micro_task,
          macroTask: task.macro_task,
          projectName: task.project?.name ?? "Cantiere",
          plannedEnd: task.planned_end!,
        }),
      });
      sent++;
    } catch (sendError) {
      console.error(`Errore invio a ${email}:`, sendError);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    totalFound: tasks?.length ?? 0,
  });
}











