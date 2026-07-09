"use client";

import { useTranslations } from "next-intl";
import { GradeIcon } from "@/components/staff/GradeIcon";
import type { StaffSessionSummary } from "@/types/api";

interface AlertBarProps {
  sessions: StaffSessionSummary[];
}

/**
 * Always-on, sticky above the worklist regardless of scroll/filter — mirrors
 * the patient app's SafetyHeader invariant of "must be impossible to miss
 * regardless of app state" (see the plan's Staff dashboard section). The
 * Red count gets Phase 9's soft pulse once the acknowledge workflow exists;
 * for now it's a plain (but unmissable) count.
 */
export function AlertBar({ sessions }: AlertBarProps) {
  const t = useTranslations("dashboard.alertBar");
  const counts = {
    RED: sessions.filter((s) => s.currentGrade === "RED").length,
    AMBER: sessions.filter((s) => s.currentGrade === "AMBER").length,
    GREEN: sessions.filter((s) => s.currentGrade === "GREEN").length,
  } as const;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-center gap-1.5">
        <GradeIcon grade="RED" className="h-5 w-5" />
        <span className="text-sm font-semibold text-foreground">
          {counts.RED} {t("redCount")}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <GradeIcon grade="AMBER" className="h-5 w-5" />
        <span className="text-sm font-semibold text-foreground">
          {counts.AMBER} {t("amberCount")}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <GradeIcon grade="GREEN" className="h-5 w-5" />
        <span className="text-sm font-semibold text-foreground">
          {counts.GREEN} {t("greenCount")}
        </span>
      </div>
    </div>
  );
}
