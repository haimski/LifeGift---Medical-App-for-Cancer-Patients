"use client";

import { useTranslations } from "next-intl";
import { PatientRow } from "@/components/staff/PatientRow";
import type { StaffSessionSummary } from "@/types/api";

interface PatientWorklistTableProps {
  sessions: StaffSessionSummary[];
  nowMs: number;
  onOpenSession: (sessionId: string) => void;
}

/**
 * The worklist's primary view — a single sortable table (sorting itself
 * happens server-side, see /api/staff/sessions), not a kanban board, per
 * the plan's confirmed decision: scales better past a handful of patients
 * and matches the row-based worklists staff already use (ED whiteboard /
 * NEWS2 style).
 */
export function PatientWorklistTable({
  sessions,
  nowMs,
  onOpenSession,
}: PatientWorklistTableProps) {
  const t = useTranslations("dashboard.table");

  if (sessions.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-foreground-muted sm:px-6">
        {t("empty")}
      </p>
    );
  }

  return (
    <div role="table" aria-label={t("title")}>
      {sessions.map((session) => (
        <PatientRow
          key={session.id}
          session={session}
          nowMs={nowMs}
          onOpen={onOpenSession}
        />
      ))}
    </div>
  );
}
