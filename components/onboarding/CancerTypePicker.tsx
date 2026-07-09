"use client";

import { useState } from "react";

const COMMON_CANCER_TYPES = [
  "Breast",
  "Lung",
  "Bowel / colorectal",
  "Prostate",
  "Lymphoma",
  "Leukaemia",
  "Myeloma",
  "Ovarian",
  "Pancreatic",
  "Skin / melanoma",
  "Head and neck",
  "Bladder",
  "Kidney",
];

const OTHER = "Other";

interface CancerTypePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CancerTypePicker({ value, onChange }: CancerTypePickerProps) {
  const isKnownType = COMMON_CANCER_TYPES.includes(value);
  const [showOther, setShowOther] = useState(value.length > 0 && !isKnownType);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">
        What type of cancer are you being treated for?
      </p>
      <div className="flex flex-wrap gap-2">
        {COMMON_CANCER_TYPES.map((type) => (
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
          {OTHER}
        </button>
      </div>
      {showOther && (
        <input
          type="text"
          value={isKnownType ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Tell us the type"
          autoFocus
          className="mt-3 min-h-11 w-full rounded-xl border border-azure-200 bg-surface px-3.5 text-sm text-foreground outline-none focus:border-azure-500"
        />
      )}
    </div>
  );
}
