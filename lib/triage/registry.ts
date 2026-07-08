import type { GlobalOverrideRule, ToxicityGuideline } from "@/lib/triage/types";
import { neutropenicSepsisOverride } from "@/lib/triage/global-rules/neutropenic-sepsis";
import { diarrhoeaGuideline } from "@/lib/triage/guidelines/diarrhoea";
import { diarrhoeaColitisImmunotherapyGuideline } from "@/lib/triage/guidelines/diarrhoea-colitis-immunotherapy";
import { vomitingGuideline } from "@/lib/triage/guidelines/vomiting";

/** Evaluated first, on every turn, before any symptom-specific guideline. */
export const GLOBAL_OVERRIDE_RULES: GlobalOverrideRule[] = [neutropenicSepsisOverride];

/** Grows one file per guideline as Phase 4 transcribes the rest of the in-scope conditions. */
export const TOXICITY_GUIDELINES: ToxicityGuideline[] = [
  diarrhoeaGuideline,
  diarrhoeaColitisImmunotherapyGuideline,
  vomitingGuideline,
];

export function findGuideline(id: string | null): ToxicityGuideline | null {
  if (!id) return null;
  return TOXICITY_GUIDELINES.find((guideline) => guideline.id === id) ?? null;
}
