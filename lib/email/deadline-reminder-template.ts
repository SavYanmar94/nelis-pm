// ============================================================
// FILE (NUOVO): lib/email/deadline-reminder-template.ts
// Stesso tono professionale usato nello script Google Sheets
// ============================================================

interface DeadlineReminderData {
  microTask: string;
  macroTask: string;
  projectName: string;
  plannedEnd: string;
}

export function buildDeadlineReminderEmail(data: DeadlineReminderData): string {
  const formattedDate = new Date(data.plannedEnd).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <p>Gentile collaboratore,</p>

      <p>questo è un avviso automatico di cortesia relativo alla pianificazione dei lavori.</p>

      <p>Si ricorda che la scadenza per la seguente attività è prevista per <strong>domani (${formattedDate})</strong>:</p>

      <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;"><strong>👉 Attività:</strong> ${data.microTask}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #666;">
          ${data.macroTask} — Cantiere: ${data.projectName}
        </p>
      </div>

      <p><strong>Cosa fare:</strong></p>
      <ul>
        <li><strong>Lavoro concluso:</strong> se l'attività è già stata ultimata, puoi ignorare questa email. Il Project Manager provvederà all'aggiornamento del cronoprogramma.</li>
        <li><strong>In caso di ritardo:</strong> contatta immediatamente il Project Manager per ricalcolare le tempistiche del cantiere.</li>
      </ul>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Si prega di non rispondere a questa email in quanto generata automaticamente.
      </p>

      <p style="margin-top: 20px;">Cordiali saluti,<br><strong>Project Management Nelis</strong></p>
    </div>
  `.trim();
}
