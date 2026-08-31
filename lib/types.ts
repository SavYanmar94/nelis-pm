// ============================================================
// FILE: lib/types.ts
// ============================================================
/**
 * Tipi generati manualmente a partire dallo schema SQL (FASE 1).
 * In futuro puoi rigenerarli automaticamente con:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > lib/database.types.ts
 * e poi mantenere questo file solo per i tipi "di dominio" (composti/UI).
 */

// ------------------------------------------------------------
// ENUM (devono combaciare esattamente con gli ENUM Postgres)
// ------------------------------------------------------------
export type OrganizationType = "Tecnico" | "Ente_Pubblico" | "Impresa";
export type ProjectStatus = "draft" | "active" | "completed" | "archived";
export type NotificationType = "RED" | "YELLOW";
export type MemberRole = "owner" | "pm" | "collaborator";

// ------------------------------------------------------------
// DATABASE TYPE (compatibile con createClient<Database>())
// ------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };

      company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_members"]["Insert"]>;
      };

      project_templates: {
        Row: {
          id: string;
          company_id: string | null;
          title: string;
          category: string;
          default_tasks_json: TemplateTaskSeed[];
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          title: string;
          category: string;
          default_tasks_json?: TemplateTaskSeed[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_templates"]["Insert"]>;
      };

      projects: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          client: string | null;
          location: string | null;
          status: ProjectStatus;
          start_date: string | null;
          end_date: string | null;
          template_used: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          partita_iva: string | null;
          codice_fiscale: string | null;
          codice_ateco: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          client?: string | null;
          location?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          end_date?: string | null;
          template_used?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          partita_iva?: string | null;
          codice_fiscale?: string | null;
          codice_ateco?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };

      stakeholders: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          role: string;
          organization_type: OrganizationType;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          role: string;
          organization_type: OrganizationType;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stakeholders"]["Insert"]>;
      };

      project_stakeholders: {
        Row: {
          id: string;
          project_id: string;
          stakeholder_id: string;
          custom_role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stakeholder_id: string;
          custom_role?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_stakeholders"]["Insert"]>;
      };

      tasks: {
        Row: {
          id: string;
          project_id: string;
          fase_macro: number;
          macro_task: string;
          fase_micro: number;
          micro_task: string;
          department: string | null;
          planned_start: string | null;
          planned_end: string | null;
          actual_start: string | null;
          actual_end: string | null;
          is_scheduled: boolean;
          is_completed: boolean;
          is_blocking: boolean;
          assigned_stakeholder_id: string | null;
          sort_order: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          predecessor_task_id: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          fase_macro?: number;
          macro_task: string;
          fase_micro?: number;
          micro_task: string;
          department?: string | null;
          planned_start?: string | null;
          planned_end?: string | null;
          actual_start?: string | null;
          actual_end?: string | null;
          is_scheduled?: boolean;
          is_completed?: boolean;
          is_blocking?: boolean;
          assigned_stakeholder_id?: string | null;
          sort_order?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          predecessor_task_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };

      notifications: {
        Row: {
          id: string;
          project_id: string;
          task_id: string;
          type: NotificationType;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id: string;
          type: NotificationType;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };

    Views: {
      project_progress: {
        Row: {
          project_id: string;
          name: string;
          total_tasks: number;
          completed_tasks: number;
          progress_percent: number;
        };
      };
    };

    Functions: {
      fn_create_company: {
        Args: { p_name: string };
        Returns: string; // uuid della company creata
      };
      fn_refresh_all_notifications: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}

// ------------------------------------------------------------
// ALIAS COMODI SULLE RIGHE DELLE TABELLE
// ------------------------------------------------------------
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyMember = Database["public"]["Tables"]["company_members"]["Row"];
export type ProjectTemplate = Database["public"]["Tables"]["project_templates"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Stakeholder = Database["public"]["Tables"]["stakeholders"]["Row"];
export type ProjectStakeholder = Database["public"]["Tables"]["project_stakeholders"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type ProjectProgress = Database["public"]["Views"]["project_progress"]["Row"];

export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type StakeholderInsert = Database["public"]["Tables"]["stakeholders"]["Insert"];

// ------------------------------------------------------------
// TIPI DI DOMINIO (composti, usati nella UI)
// ------------------------------------------------------------

/** Struttura di un task dentro default_tasks_json (template) */
export interface TemplateTaskSeed {
  fase_macro: number;
  macro_task: string;
  fase_micro: number;
  micro_task: string;
  departments: string[]; // elenco reparti suggeriti per questo micro-task
}

/** Task arricchito con i dati dello stakeholder assegnato (per Gantt/Task Cards) */
export interface TaskWithStakeholder extends Task {
  stakeholder: Pick<Stakeholder, "id" | "name" | "role" | "email" | "phone"> | null;
}

/** Riga del Morning Digest, raggruppata per severità */
export interface MorningDigestGroup {
  type: NotificationType;
  count: number;
  items: (NotificationRow & { task: Pick<Task, "micro_task" | "macro_task" | "planned_end"> })[];
}

/** Vista aggregata di un progetto per la dashboard */
export interface ProjectSummary extends Project {
  progress_percent: number;
  total_tasks: number;
  completed_tasks: number;
  red_count: number;
  yellow_count: number;
}

/** Categorie disponibili per il wizard (step 2) */
export const PROJECT_CATEGORIES = [
  "Ristrutturazione Residenziale",
  "Locale Commerciale / Ristorazione",
  "Nuova Costruzione",
  "Manutenzione Straordinaria",
  "Personalizzato da Zero",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** Input del form Step 1 del wizard (Dati Base) */
export interface WizardStep1Input {
  name: string;
  client: string;
  location: string;
  start_date: string;
  end_date: string;
  partita_iva: string;
  codice_fiscale: string;
  codice_ateco: string;
}


/** Input del form Step 4 del wizard (Stakeholders) */
export interface WizardStakeholderInput {
  stakeholder_id?: string; // se selezionato da anagrafica esistente
  name: string;
  role: string;
  organization_type: OrganizationType;
  email?: string;
  phone?: string;
  custom_role?: string;
}


/**
 * Client con service_role, da usare SOLO in contesti server-side sicuri
 * (es. cron job, Edge Functions) per bypassare RLS quando necessario.
 * NON esporre mai la service_role key al client.
 */
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface WizardTaskDraft {
  tempId: string; // id locale, solo per React key/editing — non va al DB
  fase_macro: number;
  macro_task: string;
  fase_micro: number;
  micro_task: string;
  department: string;
  planned_start: string; // stringa 'YYYY-MM-DD' o ''
  planned_end: string;
  is_blocking: boolean;
}

export interface CreateProjectPayload {
  companyId: string;
  basicInfo: WizardStep1Input;
  templateId: string | null;
  tasks: {
    fase_macro: number;
    macro_task: string;
    fase_micro: number;
    micro_task: string;
    department: string;
    stakeholder_id: string | null;
    stakeholder_name: string | null;
    stakeholder_email: string | null;
    planned_start: string | null;
    planned_end: string | null;
    is_blocking: boolean;
  }[];
  saveAsTemplate: { title: string; category: string } | null;
}

export interface RolePreset {
  id: string;
  company_id: string | null;
  label: string;
  created_at: string;
}
