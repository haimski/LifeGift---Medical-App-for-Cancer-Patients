"use client";

import { useTranslations } from "next-intl";
import { type TreatmentType } from "@/lib/context/patientContext";

const ORDER: TreatmentType[] = [
  "chemotherapy_sact",
  "immunotherapy",
  "radiotherapy",
  "targeted_therapy",
  "combination",
  "not_on_active_treatment",
];

interface TreatmentTypePickerProps {
  value: TreatmentType | null;
  onChange: (value: TreatmentType) => void;
}

export function TreatmentTypePicker({
  value,
  onChange,
}: TreatmentTypePickerProps) {
  const t = useTranslations("onboarding.treatmentTypePicker");
  const tTypes = useTranslations("treatmentTypes");
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">
        {t("question")}
      </p>
      <div className="flex flex-col gap-2">
        {ORDER.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={value === type}
            className={`min-h-11 rounded-xl border px-3.5 text-start text-sm font-medium transition-colors ${
              value === type
                ? "border-azure-600 bg-azure-600 text-white"
                : "border-azure-200 bg-surface text-accent-text hover:bg-azure-50"
            }`}
          >
            {tTypes(type)}
          </button>
        ))}
      </div>
    </div>
  );
}
