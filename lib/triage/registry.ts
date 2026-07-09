import type { GlobalOverrideRule, ToxicityGuideline } from "@/lib/triage/types";
import { neutropenicSepsisOverride } from "@/lib/triage/global-rules/neutropenic-sepsis";
import { arthralgiaMyalgiaGuideline } from "@/lib/triage/guidelines/arthralgia-myalgia";
import { bleedingBruisingGuideline } from "@/lib/triage/guidelines/bleeding-bruising";
import { chestPainGuideline } from "@/lib/triage/guidelines/chest-pain";
import { constipationGuideline } from "@/lib/triage/guidelines/constipation";
import { diarrhoeaGuideline } from "@/lib/triage/guidelines/diarrhoea";
import { diarrhoeaColitisImmunotherapyGuideline } from "@/lib/triage/guidelines/diarrhoea-colitis-immunotherapy";
import { dyspnoeaGuideline } from "@/lib/triage/guidelines/dyspnoea";
import { excludedConditionFallbackGuideline } from "@/lib/triage/guidelines/excluded-condition-fallback";
import { extravasationGuideline } from "@/lib/triage/guidelines/extravasation";
import { fatigueGuideline } from "@/lib/triage/guidelines/fatigue";
import { hypercalcaemiaGuideline } from "@/lib/triage/guidelines/hypercalcaemia";
import { msccBackPainGuideline } from "@/lib/triage/guidelines/mscc-back-pain";
import { mucositisGuideline } from "@/lib/triage/guidelines/mucositis";
import { nauseaGuideline } from "@/lib/triage/guidelines/nausea";
import { ppeSkinGuideline } from "@/lib/triage/guidelines/ppe-skin";
import { rashGuideline } from "@/lib/triage/guidelines/rash";
import { vomitingGuideline } from "@/lib/triage/guidelines/vomiting";

/** Evaluated first, on every turn, before any symptom-specific guideline. */
export const GLOBAL_OVERRIDE_RULES: GlobalOverrideRule[] = [neutropenicSepsisOverride];

/** One file per guideline — see README's scope-boundary section for what's deliberately excluded. */
export const TOXICITY_GUIDELINES: ToxicityGuideline[] = [
  diarrhoeaGuideline,
  diarrhoeaColitisImmunotherapyGuideline,
  vomitingGuideline,
  chestPainGuideline,
  constipationGuideline,
  dyspnoeaGuideline,
  fatigueGuideline,
  mucositisGuideline,
  nauseaGuideline,
  bleedingBruisingGuideline,
  rashGuideline,
  ppeSkinGuideline,
  arthralgiaMyalgiaGuideline,
  msccBackPainGuideline,
  extravasationGuideline,
  hypercalcaemiaGuideline,
  excludedConditionFallbackGuideline,
];

export function findGuideline(id: string | null): ToxicityGuideline | null {
  if (!id) return null;
  return TOXICITY_GUIDELINES.find((guideline) => guideline.id === id) ?? null;
}

/**
 * Resolves a guidelineId (as stored on a GradeEvent) to its Hebrew display
 * name, for the staff worklist's "presenting complaint" column — checks
 * regular guidelines first, then global overrides (e.g. neutropenic
 * sepsis, whose id never appears in TOXICITY_GUIDELINES), falling back to
 * the raw id itself for the engine's own "unmatched"/fail-safe ids.
 */
export function resolveDisplayName(guidelineId: string): string {
  const guideline = findGuideline(guidelineId);
  if (guideline) return guideline.displayName;
  const override = GLOBAL_OVERRIDE_RULES.find((rule) => rule.id === guidelineId);
  if (override) return override.displayName;
  return guidelineId;
}
