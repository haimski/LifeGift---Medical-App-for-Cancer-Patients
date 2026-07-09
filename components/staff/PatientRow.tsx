"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { GradeIcon } from "@/components/staff/GradeIcon";
import { TrendSparkline } from "@/components/staff/TrendSparkline";
import type { StaffSessionSummary } from "@/types/api";

const BORDER_CLASSES: Record<StaffSessionSummary["currentGrade"], string> = {
  RED: "border-rag-red",
  AMBER: "border-rag-amber",
  GREEN: "border-rag-green",
};

function formatElapsed(
  gradedAt: string,
  nowMs: number,
  tElapsed: ReturnType<typeof useTranslations>
): string {
  const minutes = Math.max(0, Math.floor((nowMs - new Date(gradedAt).getTime()) / 60000));
  if (minutes < 1) return tElapsed("justNow");
  if (minutes < 60) return tElapsed("minutesAgo", { minutes });
  return tElapsed("hoursAgo", { hours: Math.floor(minutes / 60) });
}

interface PatientRowProps {
  session: StaffSessionSummary;
  nowMs: number;
  onOpen: (sessionId: string) => void;
}

/**
 * One worklist row. New/changed rows fade + slide in on mount (~250ms
 * ease-out) rather than popping in abruptly — see the plan's Graphic
 * language section. Relies on the parent keying rows by session.id: an
 * already-mounted row's `initial` animation doesn't re-fire on every poll,
 * only genuinely new rows animate in.
 */
export function PatientRow({ session, nowMs, onOpen }: PatientRowProps) {
  const t = useTranslations("dashboard.row");
  const tElapsed = useTranslations("dashboard.elapsed");
  const tTreatment = useTranslations("treatmentTypes");
  const identity =
    session.patientName ?? t("anonymousLabel", { shortId: session.id.slice(0, 8) });

  return (
    <motion.div
      role="row"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => onOpen(session.id)}
      className={`grid cursor-pointer grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b border-s-4 border-border bg-surface px-4 py-3 text-sm text-foreground hover:bg-azure-50 sm:px-6 ${BORDER_CLASSES[session.currentGrade]}`}
    >
      <GradeIcon
        grade={session.currentGrade}
        guidelineId={session.guidelineId}
        className="h-5 w-5 shrink-0"
      />
      <div className="min-w-0">
        <p className="truncate font-medium">{identity}</p>
        <p className="truncate text-xs text-foreground-muted">
          {session.presentingComplaint} — {session.gradeLabel}
        </p>
      </div>
      <TrendSparkline gradeTrend={session.gradeTrend} />
      <span className="whitespace-nowrap text-xs text-foreground-muted">
        {formatElapsed(session.gradedAt, nowMs, tElapsed)}
      </span>
      <span className="whitespace-nowrap text-xs text-foreground-muted">
        {tTreatment(session.treatmentType)}
      </span>
    </motion.div>
  );
}
