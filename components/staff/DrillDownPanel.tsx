"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { GradeIcon } from "@/components/staff/GradeIcon";
import type { StaffSessionDetail } from "@/types/api";

interface DrillDownPanelProps {
  detail: StaffSessionDetail;
}

/**
 * Read-only transcript + "why this grade" — the traceability payoff of the
 * deterministic engine from day one (see the plan's Staff dashboard
 * section): staff see the actual matched UKONS-derived wording behind each
 * grade, quoted verbatim from the GradeEvent snapshot, not an opaque AI
 * judgement or a live re-derivation that could drift from what the patient
 * actually saw.
 */
export function DrillDownPanel({ detail }: DrillDownPanelProps) {
  const t = useTranslations("dashboard.drillDown");
  const tTreatment = useTranslations("treatmentTypes");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link
        href="/staff/dashboard"
        className="text-sm font-medium text-accent-text underline underline-offset-4"
      >
        {t("back")}
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-heading">
          {detail.patientName ?? t("contactAnonymous")}
        </h1>
        <p className="text-sm text-foreground-muted">
          {detail.cancerType} — {tTreatment(detail.treatmentType)}
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-heading">{t("contactTitle")}</h2>
        {detail.patientName && detail.contactNumber ? (
          <p className="text-sm text-foreground">
            {detail.patientName} — {detail.contactNumber}
          </p>
        ) : (
          <p className="text-sm text-foreground-muted">{t("contactAnonymous")}</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-heading">{t("whyThisGradeTitle")}</h2>
        <div className="flex flex-col gap-3">
          {detail.gradeEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-border bg-surface p-4 text-sm text-foreground"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <GradeIcon
                  grade={event.grade}
                  guidelineId={event.guidelineId}
                  className="h-4 w-4 shrink-0"
                />
                <span className="font-medium">
                  {event.presentingComplaint} — {event.gradeLabel}
                </span>
              </div>
              <p className="mb-2 text-foreground-muted">
                <span className="font-medium text-foreground">{t("criteriaLabel")}: </span>
                {event.description}
              </p>
              <p className="text-foreground-muted">
                <span className="font-medium text-foreground">{t("actionLabel")}: </span>
                {event.actionText}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-heading">{t("transcriptTitle")}</h2>
        <div className="flex flex-col gap-2">
          {detail.messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl border border-border p-3 text-sm ${
                message.role === "patient" ? "bg-azure-50" : "bg-surface"
              }`}
            >
              <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
