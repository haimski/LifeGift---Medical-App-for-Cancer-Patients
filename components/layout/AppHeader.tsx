import { Logo } from "@/components/layout/Logo";

/**
 * Persistent branding bar — logo + wordmark, nothing else. Mounted once in
 * the root layout so it appears on every screen (onboarding included).
 * Deliberately has no helpline/emergency chips: per the product's design
 * direction, no alert-style chrome lives outside the chat itself — an
 * emergency instruction, when one applies, arrives as the plain text of
 * the graded chat message (see lib/llm/phrasing.ts and each guideline's
 * Red actionText), not as standing header UI.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-2.5">
        <Logo className="h-7 w-7 shrink-0" />
        <span className="text-sm font-semibold tracking-tight text-heading">
          Lumina Care AI
        </span>
      </div>
    </header>
  );
}
