import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 16 (Skin
 * Toxicity: Palmar-Plantar Erythrodysesthesia / hand-foot syndrome). The
 * source has no Red tier for this condition — Grade 3 is still Amber
 * ("stop the SACT until discussed with the team", not an emergency).
 */
export const ppeSkinGuideline: ToxicityGuideline = {
  id: "ppe_skin",
  displayName: "Red/sore hands or feet (PPE)",
  aliases: ["hand foot syndrome", "sore palms", "sore soles", "palmar plantar"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "ppeSeverity",
      question:
        "Are your hands/feet just numb, tingly, or slightly red without pain, painful and limiting some activities, or painful and limiting your ability to look after yourself (e.g. peeling, blistering, cracking)?",
      type: "enum",
      enumOptions: [
        "none_or_painless",
        "painful_limiting_some_activities",
        "painful_limiting_self_care",
      ],
      required: true,
    },
  ],
  grades: [
    {
      grade: "AMBER",
      label: "Grade 3 (Amber)",
      description:
        "Severe skin changes (bleeding, peeling, blisters, fissures) with pain, limiting self-care.",
      matches: (f) => f.ppeSeverity === "painful_limiting_self_care",
      action:
        "Please stop the chemotherapy tablet causing this until your team has discussed it with you, and call your 24-hour helpline today — a high-urea cream and a dose review are usually needed.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "Skin changes with pain, limiting some daily activities.",
      matches: (f) => f.ppeSeverity === "painful_limiting_some_activities",
      action:
        "Please call your 24-hour helpline today to discuss whether your chemotherapy tablet dose needs adjusting, and keep the skin moisturised.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "Numbness, tingling, or painless redness/swelling.",
      matches: (f) => f.ppeSeverity === "none_or_painless",
      action:
        "Keep hands and feet moisturised, avoid tight shoes, and rest them where you can. Call your helpline if it becomes painful.",
    },
  ],
};
