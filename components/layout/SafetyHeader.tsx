import { toTelHref, EMERGENCY_NUMBER } from "@/lib/utils/phone";

interface SafetyHeaderProps {
  /** Patient's own trust 24-hour oncology helpline number. Placeholder until onboarding (Phase 1) writes a real one. */
  helplineNumber?: string;
}

/**
 * Persistent, LLM-independent safety chrome. Mounted once in the root layout
 * so it appears on every screen (onboarding included) regardless of chat
 * state — it must never depend on anything the assistant says.
 */
export function SafetyHeader({ helplineNumber = "Not set up yet" }: SafetyHeaderProps) {
  const hasHelpline = helplineNumber !== "Not set up yet";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold tracking-tight text-azure-800">
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-rag-red bg-rag-red-bg px-3 text-xs font-semibold text-rag-red-strong transition-colors hover:brightness-95"
          >
            <span aria-hidden>🚨</span>
            Life-threatening? Call 999
          </a>
        </div>
      </div>
    </header>
  );
}
