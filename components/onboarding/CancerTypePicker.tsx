"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const CANCER_TYPE_KEYS = [
  "breast",
  "lung",
  "bowel",
  "prostate",
  "lymphoma",
  "leukaemia",
  "myeloma",
  "ovarian",
  "pancreatic",
  "skin",
  "headNeck",
  "bladder",
  "kidney",
] as const;

interface CancerTypePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CancerTypePicker({ value, onChange }: CancerTypePickerProps) {
  const t = useTranslations("onboarding.cancerTypePicker");
  // The picker's displayed (translated) labels double as the stored value —
  // there's a single active locale, so this mirrors the pre-i18n behaviour.
  const commonTypes = CANCER_TYPE_KEYS.map((key) => t(`types.${key}`));
  const isKnownType = commonTypes.includes(value);
  const [showOther, setShowOther] = useState(value.length > 0 && !isKnownType);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">
        {t("question")}
      </p>
      <div className="flex flex-wrap gap-2">
        {commonTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setShowOther(false);
              onChange(type);
            }}
            aria-pressed={value === type}
            className={`min-h-11 rounded-full border px-3.5 text-sm font-medium transition-colors ${
              value === type
                ? "border-azure-600 bg-azure-600 text-white"
                : "border-azure-200 bg-surface text-accent-text hover:bg-azure-50"
            }`}
          >
            {type}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setShowOther(true);
            onChange("");
          }}
          aria-pressed={showOther}
          className={`min-h-11 rounded-full border px-3.5 text-sm font-medium transition-colors ${
            showOther
              ? "border-azure-600 bg-azure-600 text-white"
              : "border-azure-200 bg-surface text-accent-text hover:bg-azure-50"
          }`}
        >
          {t("other")}
        </button>
      </div>
      {showOther && (
        <input
          type="text"
          value={isKnownType ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("otherPlaceholder")}
          autoFocus
          className="mt-3 min-h-11 w-full rounded-xl border border-azure-200 bg-surface px-3.5 text-sm text-foreground outline-none focus:border-azure-500"
        />
      )}
    </div>
  );
}
