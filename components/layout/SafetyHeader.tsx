"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toTelHref, EMERGENCY_NUMBER } from "@/lib/utils/phone";
import { getPatientContext } from "@/lib/context/patientContext";

const PLACEHOLDER = "Not set up yet";

/**
 * Persistent, LLM-independent safety chrome. Mounted once in the root layout
 * so it appears on every screen (onboarding included) regardless of chat
 * state — it must never depend on anything the assistant says.
 *
 * Starts with the placeholder (matching the build-time static server
 * output, which has no `window`/localStorage) and corrects to the
 * patient's real helpline number after mount — see the same hydration-safe
 * pattern used in app/chat/page.tsx. Re-checks on every route change too,
 * since this component lives in the root layout and doesn't remount as
 * the patient moves through onboarding — without that, it would keep
 * showing the placeholder even after the patient enters a real number.
 */
export function SafetyHeader() {
  const pathname = usePathname();
  const [helplineNumber, setHelplineNumber] = useState(PLACEHOLDER);

  useEffect(() => {
    const context = getPatientContext();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: see doc comment above
    setHelplineNumber(context?.helplineNumber || PLACEHOLDER);
  }, [pathname]);

  const hasHelpline = helplineNumber !== PLACEHOLDER;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold tracking-tight text-heading">
          LifeGift
        </span>
        <div className="flex items-center gap-2">
          <a
            href={hasHelpline ? toTelHref(helplineNumber) : "#"}
            aria-disabled={!hasHelpline}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-azure-200 bg-azure-50 px-3 text-xs font-medium text-azure-700 transition-colors hover:bg-azure-100 aria-disabled:pointer-events-none aria-disabled:opacity-60"
          >
            <span aria-hidden>📞</span>
            {hasHelpline ? "24-hour helpline" : "Helpline not set up"}
          </a>
          <a
            href={toTelHref(EMERGENCY_NUMBER)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-rag-red bg-rag-red-bg px-3 text-xs font-semibold text-rag-red-badge-text transition-colors hover:brightness-95"
          >
            <span aria-hidden>🚨</span>
            Life-threatening? Call 999
          </a>
        </div>
      </div>
    </header>
  );
}
