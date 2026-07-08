import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 10
 * (Mucositis/Stomatitis/Oesophagitis).
 */
export const mucositisGuideline: ToxicityGuideline = {
  id: "mucositis",
  displayName: "Mouth/mucositis",
  aliases: ["mouth ulcers", "sore mouth", "stomatitis", "oesophagitis"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "mouthSeverity",
      question:
        "Are you able to eat and drink normally? Would you describe your mouth as: painless or mild soreness (eating fine), painful but still eating/drinking okay, painful and finding it hard to eat/drink, or so painful you can barely take anything in?",
      type: "enum",
      enumOptions: [
        "painless_eating_normally",
        "painful_eating_ok",
        "painful_difficulty_eating",
        "severe_minimal_intake",
      ],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "Significant pain, minimal intake and/or reduced urine output.",
      matches: (f) => f.mouthSeverity === "severe_minimal_intake",
      action:
        "This needs assessment today — you may need fluids and pain relief your team can only give in person. Please call your 24-hour helpline now or go to your same-day emergency care unit.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description: "Painful erythema, and difficulty eating and drinking.",
      matches: (f) => f.mouthSeverity === "painful_difficulty_eating",
      action:
        "Please call your 24-hour helpline today — you may need stronger pain relief and a check for infection or dehydration.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "Painful ulcers/erythema, mild soreness, but eating and drinking normally.",
      matches: (f) => f.mouthSeverity === "painful_eating_ok",
      action:
        "Try ice chips for relief and an anti-inflammatory mouthwash if you have one. Call your 24-hour helpline today so your team knows, especially if you're due chemotherapy soon.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "Painless ulcers, erythema, or mild soreness — eating and drinking normally.",
      matches: (f) => f.mouthSeverity === "painless_eating_normally",
      action:
        "Keep up gentle mouth care and stay hydrated. Call your helpline if it becomes painful or you notice white patches (possible thrush).",
    },
  ],
};
