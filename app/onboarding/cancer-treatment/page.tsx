"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CancerTypePicker } from "@/components/onboarding/CancerTypePicker";
import { TreatmentTypePicker } from "@/components/onboarding/TreatmentTypePicker";
import { YesNoToggle } from "@/components/ui/YesNoToggle";
import {
  getOnboardingDraft,
  saveOnboardingDraft,
  type TreatmentType,
} from "@/lib/context/patientContext";

export default function OnboardingCancerTreatmentPage() {
  const router = useRouter();
  const [cancerType, setCancerType] = useState("");
  const [treatmentType, setTreatmentType] = useState<TreatmentType | null>(
    null
  );
  const [recentSact, setRecentSact] = useState<boolean | null>(null);

  useEffect(() => {
    // Next.js prerenders this page at build time with no `window`, so
    // reading localStorage during the initial render (e.g. a lazy useState
    // initializer) would make the server output and the client's first
    // paint disagree and trigger a hydration-mismatch reset. Reading a
    // previously-saved draft here instead, after mount, keeps first paint
    // identical to the static server output.
    const draft = getOnboardingDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    if (draft.cancerType) setCancerType(draft.cancerType);
    if (draft.treatmentType) setTreatmentType(draft.treatmentType);
    if (typeof draft.recentSactWithin6Weeks === "boolean") {
      setRecentSact(draft.recentSactWithin6Weeks);
    }
  }, []);

  const canContinue =
    cancerType.trim().length > 0 &&
    treatmentType !== null &&
    recentSact !== null;

  function handleContinue() {
    if (!canContinue) return;
    saveOnboardingDraft({
      cancerType: cancerType.trim(),
      treatmentType: treatmentType!,
      recentSactWithin6Weeks: recentSact!,
    });
    router.push("/onboarding/helpline");
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-heading">
          A bit about your treatment
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          This helps us give advice that fits your situation. You can change
          this later.
        </p>
      </div>

      <CancerTypePicker value={cancerType} onChange={setCancerType} />
      <TreatmentTypePicker value={treatmentType} onChange={setTreatmentType} />
      <YesNoToggle
        label="Have you had any cancer treatment (including tablets) in the last 6 weeks?"
        value={recentSact}
        onChange={setRecentSact}
      />

      <Button onClick={handleContinue} disabled={!canContinue}>
        Continue
      </Button>
    </main>
  );
}
