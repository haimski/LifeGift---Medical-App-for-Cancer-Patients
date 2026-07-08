interface YesNoToggleProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function YesNoToggle({ label, value, onChange }: YesNoToggleProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div className="flex gap-2">
        {(
          [
            { text: "Yes", val: true },
            { text: "No", val: false },
          ] as const
        ).map((option) => (
          <button
            key={option.text}
            type="button"
            onClick={() => onChange(option.val)}
            aria-pressed={value === option.val}
            className={`min-h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors ${
              value === option.val
                ? "border-azure-600 bg-azure-600 text-white"
                : "border-azure-200 bg-surface text-azure-700 hover:bg-azure-50"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
