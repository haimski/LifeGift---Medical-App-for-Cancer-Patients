"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  HelplineNumberInput,
  isLikelyPhoneNumber,
} from "@/components/onboarding/HelplineNumberInput";
import {
  getOnboardingDraft,
  savePatientContext,
} from "@/lib/context/patientContext";

export default function OnboardingHelplinePage() {
  const router = useRouter();
  const t = useTranslations("onboarding.helpline");
  const [helplineNumber, setHelplineNumber] = useState("");
  // null = "not checked yet" — renders nothing, matching the build-time
  // static server output (no `window`/localStorage). Only after mount do
  // we know whether the earlier draft is valid; see the effect below.
  const [isValidEntry, setIsValidEntry] = useState<boolean | null>(null);

  useEffect(() => {
    const draft = getOnboardingDraft();
    const valid = Boolean(draft.cancerType && draft.treatmentType);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: see comment above
    setIsValidEntry(valid);
    if (!valid) {
      router.replace("/onboarding/cancer-treatment");
      return;
    }
    if (draft.helplineNumber) {
      setHelplineNumber(draft.helplineNumber);
    }
  }, [router]);

  const trimmed = helplineNumber.trim();
  const canContinue = trimmed.length > 0 && isLikelyPhoneNumber(trimmed);

  function handleContinue() {
    if (!canContinue) return;
    const latestDraft = getOnboardingDraft();
    if (!latestDraft.cancerType || !latestDraft.treatmentType) return;
    savePatientContext({
      cancerType: latestDraft.cancerType,
      treatmentType: latestDraft.treatmentType,
      recentSactWithin6Weeks: latestDraft.recentSactWithin6Weeks ?? false,
      helplineNumber: trimmed,
    });
    router.push("/chat");
  }

  if (!isValidEntry) return null;

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-heading">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      <HelplineNumberInput
        value={helplineNumber}
        onChange={setHelplineNumber}
      />

      <Button onClick={handleContinue} disabled={!canContinue}>
        {t("startChatting")}
      </Button>
    </main>
  );
}
