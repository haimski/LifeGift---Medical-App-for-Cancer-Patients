"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface IdentifyPromptProps {
  onSubmit: (name: string, contactNumber: string) => void;
  onSkip: () => void;
}

/**
 * The progressive-identification prompt shown once, the first time a
 * session's turn grades Amber or Red — see app/chat/page.tsx for the
 * timing rules (never blocks or delays the RedFlagInterstitial). Purely a
 * request: skipping is always one tap away, and only affects whether staff
 * can proactively follow up, never the patient's own guidance.
 */
export function IdentifyPrompt({ onSubmit, onSkip }: IdentifyPromptProps) {
  const t = useTranslations("chat.identify");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const canSave = name.trim().length > 0 && contactNumber.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSubmit(name.trim(), contactNumber.trim());
  }

  return (
    <Card className="mx-4 mb-3 text-sm text-foreground">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <p className="font-medium">{t("title")}</p>
        <p className="text-xs text-foreground-muted">{t("description")}</p>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("namePlaceholder")}
          className="min-h-11 w-full rounded-xl border border-azure-200 bg-surface px-3.5 text-sm text-foreground outline-none focus:border-azure-500"
        />
        <input
          type="tel"
          inputMode="tel"
          value={contactNumber}
          onChange={(event) => setContactNumber(event.target.value)}
          placeholder={t("contactPlaceholder")}
          className="min-h-11 w-full rounded-xl border border-azure-200 bg-surface px-3.5 text-sm text-foreground outline-none focus:border-azure-500"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={!canSave}>
            {t("save")}
          </Button>
          <Button type="button" variant="secondary" onClick={onSkip}>
            {t("skip")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
