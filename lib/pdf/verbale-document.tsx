// ============================================================
// FILE: lib/pdf/verbale-document.tsx
// ============================================================

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const COLORS = {
  primary: "#579bfc",
  dark: "#323338",
  muted: "#676879",
  border: "#d0d4e4",
  bgSoft: "#f5f6f8",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.dark,
  },
  headerBar: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  infoBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    marginRight: "2%",
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  infoValueEmpty: {
    fontSize: 11,
    color: COLORS.muted,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSoft,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.muted,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkboxCol: { width: 24 },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1.2,
    borderColor: COLORS.muted,
    borderRadius: 2,
  },
  macroCol: { width: "22%", fontSize: 9 },
  microCol: { width: "42%", fontSize: 9 },
  deptCol: { width: "26%", fontSize: 9, color: COLORS.muted },
  emptyLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 8,
  },
  observationsBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    height: 90,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark,
    height: 32,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },
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
  stakeholder: { name: string } | null;
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
        </View>

        {mode === "completa"
          ? tasks.map((t, i) => (
              <View key={i} style={styles.row} wrap={false}>
                <View style={styles.checkboxCol}>
                  <View style={styles.checkbox} />
                </View>
                <Text style={styles.macroCol}>{t.macro_task}</Text>
                <Text style={styles.microCol}>{t.micro_task}</Text>
                <Text style={styles.deptCol}>{t.stakeholder?.name ?? t.department ?? "—"}</Text>
              </View>
            ))
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
