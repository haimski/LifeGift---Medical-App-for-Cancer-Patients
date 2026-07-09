"use client";

import { toTelHref } from "@/lib/utils/phone";

const PHONE_PATTERN = /^[+()\d][\d\s()+-]{6,}$/;

interface HelplineNumberInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function isLikelyPhoneNumber(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}

export function HelplineNumberInput({
  value,
  onChange,
}: HelplineNumberInputProps) {
  const trimmed = value.trim();
  const valid = trimmed.length === 0 || isLikelyPhoneNumber(trimmed);

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-foreground">
        What&apos;s your 24-hour oncology helpline number?
      </p>
      <p className="mb-2 text-xs text-foreground-muted">
        This is on your treatment alert card. We&apos;ll keep it one tap away
        at the top of every screen.
      </p>
      <input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. 01234 567890"
        className={`min-h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-foreground outline-none focus:border-azure-500 ${
          valid ? "border-azure-200" : "border-foreground"
        }`}
      />
      {!valid && (
        // Plain form validation, not a triage grade — deliberately not
        // using the reserved rag-red tokens (see globals.css) so a typo
        // in a phone number never looks like a clinical Red result.
        <p className="mt-1 text-xs text-foreground">
          <span aria-hidden>⚠</span> That doesn&apos;t look like a phone
          number yet.
        </p>
      )}
      {valid && trimmed.length > 0 && (
        <a
          href={toTelHref(trimmed)}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-azure-200 bg-azure-50 px-3 text-xs font-medium text-azure-700"
        >
          <span aria-hidden>📞</span>
          Preview: tap to call {trimmed}
        </a>
      )}
    </div>
  );
}
