// ============================================================
// FILE (NUOVO): components/dashboard/project-search.tsx
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { ProjectSummaryGrid } from "./project-summary-grid";
import type { ProjectSummary } from "@/lib/types";

export function ProjectSearch({ projects }: { projects: ProjectSummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.client ?? "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca cantiere per nome o cliente..."
          className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2"
        />
      </div>
      <ProjectSummaryGrid projects={filtered} />
    </div>
  );
}
