"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function OnboardingWelcomePage() {
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col justify-center gap-5 px-5 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-azure-800">
          Welcome to LifeGift
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          A calm place to check in about symptoms during your cancer
          treatment.
        </p>
      </div>

      <Card className="text-sm text-foreground">
        <p className="mb-3">
          LifeGift can help you understand whether a symptom is safe to
          watch, worth calling your care team about, or needs urgent
          attention — based on the same guidance your 24-hour oncology
          helpline uses.
        </p>
        <p className="rounded-xl border border-rag-red bg-rag-red-bg px-3 py-2.5 font-medium text-rag-red-strong">
          This does not replace emergency care. If you think this is a
          medical emergency, call 999 now.
        </p>
      </Card>

      <div className="flex flex-col gap-2">
        <Button onClick={() => router.push("/onboarding/cancer-treatment")}>
          Continue
        </Button>
        <p className="text-center text-xs text-foreground-muted">
          No account or sign-in needed to get started.
        </p>
      </div>
    </main>
  );
}
