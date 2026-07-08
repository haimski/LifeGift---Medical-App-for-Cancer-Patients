import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 13 (Skin
 * Rash). The source explicitly redirects immunotherapy patients to
 * Guideline 26 (immune-related skin toxicities), one of the excluded
 * irAE algorithms — so those patients are routed to the generic
 * excluded-condition fallback instead of the tiers below.
 */
export const rashGuideline: ToxicityGuideline = {
  id: "rash",
  displayName: "Skin rash",
  aliases: ["rash", "skin eruption", "hives"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "excluded_condition_fallback",
  },
  screeningFields: [
    {
      id: "rashCoveragePercent",
      question:
        "Roughly what percentage of your skin does the rash cover (a rough estimate is fine)?",
      type: "number",
      required: true,
    },
    {
      id: "affectsSleepOrDailyActivities",
      question: "Is it itchy enough, or sore enough, to affect your sleep or daily activities?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasBlisteringOrUlceration",
      question: "Is there any blistering, peeling, or open/ulcerated skin?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasSpontaneousBleedingOrInfectionSigns",
      question:
        "Is there any spontaneous bleeding from the rash, or signs of infection (pus, spreading redness, fever)?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "Life-threatening: spontaneous bleeding or signs of infection.",
      matches: (f) => f.hasSpontaneousBleedingOrInfectionSigns === true,
      action:
        "This needs urgent assessment. Please go to A&E now or call your 24-hour helpline immediately.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description:
        "More than 30% of skin surface, generalised/exfoliative/ulcerative, or blistering.",
      matches: (f) =>
        (typeof f.rashCoveragePercent === "number" && f.rashCoveragePercent >= 30) ||
        f.hasBlisteringOrUlceration === true,
      action:
        "This needs an urgent dermatology or oncology review today. Please call your 24-hour helpline now.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description:
        "10-30% of skin surface, or itching/tightness affecting sleep or daily activities.",
      matches: (f) =>
        (typeof f.rashCoveragePercent === "number" && f.rashCoveragePercent >= 10) ||
        f.affectsSleepOrDailyActivities === true,
      action:
        "Use a gentle emollient cream and an antihistamine if you have one. Call your 24-hour helpline today so your team is aware.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "Less than 10% of skin surface, simple rash.",
      matches: (f) =>
        typeof f.rashCoveragePercent === "number" && f.rashCoveragePercent < 10,
      action:
        "Keep the area moisturised and avoid irritants. Call your helpline if it spreads, becomes itchy, or you feel unwell.",
    },
  ],
};
