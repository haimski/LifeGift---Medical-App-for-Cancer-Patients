export type TreatmentType =
  | "chemotherapy_sact"
  | "immunotherapy"
  | "radiotherapy"
  | "targeted_therapy"
  | "combination"
  | "not_on_active_treatment";

export const TREATMENT_TYPE_LABELS: Record<TreatmentType, string> = {
  chemotherapy_sact: "Chemotherapy (SACT)",
  immunotherapy: "Immunotherapy",
  radiotherapy: "Radiotherapy",
  targeted_therapy: "Targeted therapy",
  combination: "A combination of treatments",
  not_on_active_treatment: "Not currently on active treatment",
};

/** Full patient context — required before the chat screen can be used. */
export interface PatientContext {
  cancerType: string;
  treatmentType: TreatmentType;
  helplineNumber: string;
  /** Feeds the global neutropenic sepsis override rule regardless of treatmentType. */
  recentSactWithin6Weeks: boolean;
}

/** Partial context accumulated across the 3 onboarding screens. */
export type OnboardingDraft = Partial<PatientContext>;

const PATIENT_CONTEXT_KEY = "lifegift:patientContext";
const ONBOARDING_DRAFT_KEY = "lifegift:onboardingDraft";

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getPatientContext(): PatientContext | null {
  return readJSON<PatientContext>(PATIENT_CONTEXT_KEY);
}

export function savePatientContext(context: PatientContext): void {
  writeJSON(PATIENT_CONTEXT_KEY, context);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  }
}

export function getOnboardingDraft(): OnboardingDraft {
  return readJSON<OnboardingDraft>(ONBOARDING_DRAFT_KEY) ?? {};
}

export function saveOnboardingDraft(partial: OnboardingDraft): void {
  writeJSON(ONBOARDING_DRAFT_KEY, { ...getOnboardingDraft(), ...partial });
}

export function isCompletePatientContext(
  draft: OnboardingDraft
): draft is PatientContext {
  return (
    typeof draft.cancerType === "string" &&
    draft.cancerType.trim().length > 0 &&
    typeof draft.treatmentType === "string" &&
    typeof draft.helplineNumber === "string" &&
    draft.helplineNumber.trim().length > 0 &&
    typeof draft.recentSactWithin6Weeks === "boolean"
  );
}
