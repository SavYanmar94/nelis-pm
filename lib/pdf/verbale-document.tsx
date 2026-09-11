// ============================================================
// FILE (RISCRITTO): lib/pdf/verbale-document.tsx
// + colore stato (pallino+etichetta), date Schedulato/Completato,
// checkbox pre-spuntato se completato
// ============================================================

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const COLORS = {
  primary: "#579bfc",
  dark: "#323338",
  muted: "#676879",
  border: "#d0d4e4",
  bgSoft: "#f5f6f8",
};

const STATUS_COLORS: Record<string, string> = {
  not_scheduled: "#e2445c",
  in_progress: "#fdab3d",
  completed: "#00c875",
  overdue: "#e2445c",
};

const STATUS_LABELS: Record<string, string> = {
  not_scheduled: "Da avviare",
  in_progress: "In corso",
  completed: "Completato",
  overdue: "In ritardo",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: COLORS.dark },
  headerBar: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 11, color: COLORS.muted, marginBottom: 16 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  infoBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    marginRight: "2%",
  },
  infoLabel: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase", marginBottom: 3 },
  infoValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  infoValueEmpty: { fontSize: 11, color: COLORS.muted },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSoft,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  tableHeaderCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.muted, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkboxCol: { width: 20 },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderColor: COLORS.muted,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#00c875", borderColor: "#00c875" },
  checkmark: { fontSize: 8, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  macroCol: { width: "16%", fontSize: 8 },
  microCol: { width: "25%", fontSize: 8 },
  deptCol: { width: "15%", fontSize: 8, color: COLORS.muted },
  statusCol: { width: "13%" },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 3 },
  statusText: { fontSize: 7 },
  dateCol: { width: "11%", fontSize: 7.5, color: COLORS.muted },
  emptyLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, height: 14 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 20, marginBottom: 8 },
  observationsBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, height: 90 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  signatureBlock: { width: "45%" },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: COLORS.dark, height: 32, marginBottom: 4 },
  signatureLabel: { fontSize: 9, color: COLORS.muted },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.muted,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
});

interface VerbaleTaskRow {
  macro_task: string;
  micro_task: string;
  department: string | null;
  is_scheduled: boolean;
  is_completed: boolean;
  actual_start: string | null;
  actual_end: string | null;
  planned_end: string | null;
  stakeholder: { name: string } | null;
}

function computeStatus(t: Pick<VerbaleTaskRow, "is_scheduled" | "is_completed" | "planned_end">): string {
  if (t.is_completed) return "completed";
  if (t.planned_end) {
    const end = new Date(t.planned_end);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) return "overdue";
  }
  if (t.is_scheduled) return "in_progress";
  return "not_scheduled";
}

function formatDatePdf(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

interface VerbaleDocumentProps {
  project: { name: string; client: string | null; location: string | null };
  tasks: VerbaleTaskRow[];
  mode: "completa" | "vuota";
  controlDate: string;
  controlType: string;
  emptyRowsCount?: number;
}

export function VerbaleDocument({
  project,
  tasks,
  mode,
  controlDate,
  controlType,
  emptyRowsCount = 20,
}: VerbaleDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar} />
        <Text style={styles.title}>Verbale di Controllo Cantiere</Text>
        <Text style={styles.subtitle}>{project.name}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{project.client || "—"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Indirizzo</Text>
            <Text style={styles.infoValue}>{project.location || "—"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Data controllo</Text>
            <Text style={styles.infoValue}>{controlDate || "—"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Tipo di controllo</Text>
            <Text style={controlType ? styles.infoValue : styles.infoValueEmpty}>
              {controlType || "________________"}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.checkboxCol]}>Fatto</Text>
          <Text style={[styles.tableHeaderCell, styles.macroCol]}>Macro-Task</Text>
          <Text style={[styles.tableHeaderCell, styles.microCol]}>Micro-Task</Text>
          <Text style={[styles.tableHeaderCell, styles.deptCol]}>Responsabile</Text>
          <Text style={[styles.tableHeaderCell, styles.statusCol]}>Stato</Text>
          <Text style={[styles.tableHeaderCell, styles.dateCol]}>Sched.</Text>
          <Text style={[styles.tableHeaderCell, styles.dateCol]}>Compl.</Text>
        </View>

        {mode === "completa"
          ? tasks.map((t, i) => {
              const status = computeStatus(t);
              return (
                <View key={i} style={styles.row} wrap={false}>
                  <View style={styles.checkboxCol}>
                    <View style={t.is_completed ? [styles.checkbox, styles.checkboxChecked] : styles.checkbox}>
                      {t.is_completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                  <Text style={styles.macroCol}>{t.macro_task}</Text>
                  <Text style={styles.microCol}>{t.micro_task}</Text>
                  <Text style={styles.deptCol}>{t.stakeholder?.name ?? t.department ?? "—"}</Text>
                  <View style={styles.statusCol}>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                      <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
                    </View>
                  </View>
                  <Text style={styles.dateCol}>{formatDatePdf(t.actual_start)}</Text>
                  <Text style={styles.dateCol}>{formatDatePdf(t.actual_end)}</Text>
                </View>
              );
            })
          : Array.from({ length: emptyRowsCount }).map((_, i) => (
              <View key={i} style={styles.row} wrap={false}>
                <View style={styles.checkboxCol}>
                  <View style={styles.checkbox} />
                </View>
                <View style={styles.emptyLine} />
              </View>
            ))}

        <Text style={styles.sectionTitle}>Osservazioni generali</Text>
        <View style={styles.observationsBox} />

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma Project Manager</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma Committente</Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Nelis PM · Generato il ${new Date().toLocaleDateString("it-IT")} · Pagina ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}