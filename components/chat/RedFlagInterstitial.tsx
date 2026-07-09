import { useTranslations } from "next-intl";
import { toTelHref, EMERGENCY_NUMBER } from "@/lib/utils/phone";

interface RedFlagInterstitialProps {
  show: boolean;
  helplineNumber: string;
  onAcknowledge: () => void;
}

/**
 * Full-screen blocking overlay for a Red grade. Props are just a boolean
 * and a phone number — zero dependency on anything the LLM said. The
 * frontend must only ever set `show` from the API response's deterministic
 * `redFlag` field (sourced from the rules engine), never from parsing the
 * assistant's phrased message text. See app/chat/page.tsx.
 */
export function RedFlagInterstitial({
  show,
  helplineNumber,
  onAcknowledge,
}: RedFlagInterstitialProps) {
  const t = useTranslations("redFlag");

  if (!show) return null;

  const hasHelpline = helplineNumber.trim().length > 0;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="red-flag-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-rag-red-strong px-6 py-10 text-center text-white"
    >
      <span className="text-5xl" aria-hidden>
        🚨
      </span>
      <h1 id="red-flag-title" className="text-2xl font-bold">
        {t("title")}
      </h1>
      <p className="max-w-xs text-base">{t("body")}</p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <a
          href={toTelHref(EMERGENCY_NUMBER)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-white px-4 text-lg font-bold text-rag-red-strong"
        >
          <span aria-hidden>📞</span>
          {t("call999")}
        </a>
        {hasHelpline && (
          <a
            href={toTelHref(helplineNumber)}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-white px-4 text-lg font-semibold text-white"
          >
            <span aria-hidden>📞</span>
            {t("callHelpline")}
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onAcknowledge}
        className="mt-4 min-h-11 px-4 text-sm font-medium text-white underline underline-offset-4"
      >
        {t("acknowledge")}
      </button>
    </div>
  );
}
