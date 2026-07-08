import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 7
 * (Dyspnoea/Shortness of Breath). The source explicitly redirects
 * immunotherapy patients to Guideline 24 (immunotherapy-induced
 * pneumonitis), which is one of the excluded lab/imaging-based irAE
 * algorithms — so patients on/recently treated with immunotherapy are
 * routed to the generic excluded-condition fallback instead of the
 * standard tiers below, per the app's scope boundary.
 */
export const dyspnoeaGuideline: ToxicityGuideline = {
  id: "dyspnoea",
  displayName: "Dyspnoea / shortness of breath",
  aliases: ["breathless", "short of breath", "can't catch my breath", "sob"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "excluded_condition_fallback",
  },
  screeningFields: [
    {
      id: "dyspnoeaSeverity",
      question:
        "Is the breathlessness new, and how much activity brings it on — none (baseline normal), only with moderate activity, with minimal activity, or even at rest?",
      type: "enum",
      enumOptions: ["none", "moderate_exertion", "minimal_exertion", "at_rest", "life_threatening"],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "Life-threatening symptoms requiring urgent intervention.",
      matches: (f) => f.dyspnoeaSeverity === "life_threatening",
      action:
        "This is a medical emergency. Call 999 or go to A&E now.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description: "New onset dyspnoea at rest.",
      matches: (f) => f.dyspnoeaSeverity === "at_rest",
      action:
        "Breathlessness at rest needs urgent assessment. Please go to A&E now or call your 24-hour helpline immediately.",
    },
    {
      grade: "RED",
      label: "Grade 2 (Red)",
      description: "New onset dyspnoea with minimal exertion.",
      matches: (f) => f.dyspnoeaSeverity === "minimal_exertion",
      action:
        "This needs same-day assessment. Please call your 24-hour helpline now or go to A&E.",
    },
    {
      grade: "AMBER",
      label: "Grade 1 (Amber)",
      description: "New onset dyspnoea with moderate exertion.",
      matches: (f) => f.dyspnoeaSeverity === "moderate_exertion",
      action:
        "Please call your 24-hour helpline today to discuss this — it's important your team knows about new breathlessness, especially if you also have a cough, fever, or leg swelling.",
    },
    {
      grade: "GREEN",
      label: "None",
      description: "No change in breathlessness from your normal baseline.",
      matches: (f) => f.dyspnoeaSeverity === "none",
      action: "No specific action needed for breathlessness right now.",
    },
  ],
};
