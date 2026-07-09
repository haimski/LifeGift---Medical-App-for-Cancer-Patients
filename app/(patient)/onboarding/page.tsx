"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const t = useTranslations("onboarding.welcome");
  const tCommon = useTranslations("common");

  return (
    <main className="flex flex-1 flex-col justify-center gap-5 px-5 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-heading">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      <Card className="text-sm text-foreground">
        <p className="mb-3">{t("description")}</p>
        <p className="rounded-xl border border-rag-red bg-rag-red-bg px-3 py-2.5 font-medium text-rag-red-badge-text">
          {t("emergencyNotice")}
        </p>
      </Card>

      <div className="flex flex-col gap-2">
        <Button onClick={() => router.push("/onboarding/cancer-treatment")}>
          {tCommon("continue")}
        </Button>
        <p className="text-center text-xs text-foreground-muted">
          {t("noAccountNeeded")}
        </p>
      </div>
    </main>
  );
}
