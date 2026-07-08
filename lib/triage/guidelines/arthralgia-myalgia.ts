import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 2
 * (Arthralgia/Myalgia). The source explicitly redirects immunotherapy
 * patients to Guideline 27 (immune-related arthralgia/myalgia, which can
 * progress to myositis/myocarditis) — one of the excluded irAE
 * algorithms requiring CK/ESR/troponin bloods — so those patients are
 * routed to the generic excluded-condition fallback instead.
 */
export const arthralgiaMyalgiaGuideline: ToxicityGuideline = {
  id: "arthralgia_myalgia",
  displayName: "Joint / muscle pain",
  aliases: ["joint pain", "muscle pain", "myalgia", "arthralgia", "aching joints"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "excluded_condition_fallback",
  },
  screeningFields: [
    {
      id: "painInterferenceLevel",
      question:
        "How much is the pain affecting your daily activities — not interfering at all, interfering with some activities, severe pain or loss of ability to do some things, or are you bedridden?",
      type: "enum",
      enumOptions: ["none_or_mild", "moderate", "severe", "bedridden"],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "Bedridden or disabling.",
      matches: (f) => f.painInterferenceLevel === "bedridden",
      action:
        "Please call your 24-hour helpline now, or go to your same-day emergency care unit, for urgent pain relief and assessment.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description: "Severe pain and/or loss of ability to perform some activities.",
      matches: (f) => f.painInterferenceLevel === "severe",
      action:
        "Please call your 24-hour helpline today — you may need stronger pain relief and a check that this isn't something needing urgent treatment.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "Moderate pain, interfering with some normal activities.",
      matches: (f) => f.painInterferenceLevel === "moderate",
      action:
        "Try heat (a heat pad or warm bath) and review your pain relief. Call your 24-hour helpline today, and let them know if you also develop a temperature.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "Mild pain, not interfering with daily activities.",
      matches: (f) => f.painInterferenceLevel === "none_or_mild",
      action:
        "This is common during treatment. Simple pain relief and rest should help — call your helpline if it worsens or you develop a temperature.",
    },
  ],
};
