"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function StaffLoginPage() {
  const t = useTranslations("dashboard.login");
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setInvalid(false);

    const result = await signIn("credentials", { passcode, redirect: false });

    setSubmitting(false);
    if (!result || result.error) {
      setInvalid(true);
      return;
    }
    router.push("/staff/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm text-sm text-foreground">
        <h1 className="mb-1 text-lg font-semibold text-heading">{t("title")}</h1>
        <p className="mb-4 text-xs text-foreground-muted">{t("subtitle")}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder={t("passcodePlaceholder")}
            autoFocus
            className="min-h-11 w-full rounded-xl border border-azure-200 bg-surface px-3.5 text-sm text-foreground outline-none focus:border-azure-500"
          />
          {invalid && (
            // Plain form validation, not a triage grade — see
            // HelplineNumberInput's same convention for why this stays
            // neutral rather than using the reserved rag-red tokens.
            <p className="text-xs text-foreground">
              <span aria-hidden>⚠</span> {t("invalidPasscode")}
            </p>
          )}
          <Button type="submit" disabled={submitting || passcode.length === 0}>
            {t("submit")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
