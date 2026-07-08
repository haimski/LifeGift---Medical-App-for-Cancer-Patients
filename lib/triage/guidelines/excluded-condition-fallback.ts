import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * Redirect target for guidelines whose immunotherapy-specific variant is a
 * lab-value-driven immune-related-adverse-event algorithm (guidelines
 * 18-28 in the source PDF — adrenal/thyroid/hepatic/neuro/skin irAEs
 * etc.), which this app deliberately does not attempt to grade — see
 * README's scope-boundary section. Always floors at Amber and points the
 * patient at their oncology team rather than fabricating a specific
 * pathway. Never defaults to Green.
 */
export const excludedConditionFallbackGuideline: ToxicityGuideline = {
  id: "excluded_condition_fallback",
  displayName: "Needs clinical assessment",
  aliases: [],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [],
  grades: [
    {
      grade: "AMBER",
      label: "Needs oncology team input",
      description:
        "Symptom pattern that, on immunotherapy, needs blood tests or an in-person assessment this chat can't do.",
      matches: () => true,
      action:
        "Because of the combination of your treatment and this symptom, this needs your oncology team to assess it directly — it may need blood tests. Please call your 24-hour helpline today to talk it through.",
    },
  ],
};
