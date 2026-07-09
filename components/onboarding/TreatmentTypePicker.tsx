"use client";

import {
  TREATMENT_TYPE_LABELS,
  type TreatmentType,
} from "@/lib/context/patientContext";

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
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">
        What treatment are you currently receiving?
      </p>
      <div className="flex flex-col gap-2">
        {ORDER.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={value === type}
            className={`min-h-11 rounded-xl border px-3.5 text-left text-sm font-medium transition-colors ${
              value === type
                ? "border-azure-600 bg-azure-600 text-white"
                : "border-azure-200 bg-surface text-accent-text hover:bg-azure-50"
            }`}
          >
            {TREATMENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
