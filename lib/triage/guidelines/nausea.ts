import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 11
 * (Nausea). Only 3 tiers in the source — graded by oral intake rather
 * than the sensation of nausea itself, since intake is what actually
 * drives urgency (dehydration/malnutrition risk).
 */
export const nauseaGuideline: ToxicityGuideline = {
  id: "nausea",
  displayName: "Nausea",
  aliases: ["feeling sick", "queasy", "nauseous"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "nauseaIntakeLevel",
      question:
        "Are you able to eat and drink a reasonable amount, is your intake reduced but still something, or are you unable to keep any food or fluids down?",
      type: "enum",
      enumOptions: ["eating_drinking_normally", "decreased_intake", "no_intake"],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description: "Inadequate or no oral fluid/food intake.",
      matches: (f) => f.nauseaIntakeLevel === "no_intake",
      action:
        "This needs same-day assessment for fluids and different anti-sickness medication. Please call your 24-hour helpline now or go to your same-day emergency care unit.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "Oral intake decreased, without significant weight loss or dehydration yet.",
      matches: (f) => f.nauseaIntakeLevel === "decreased_intake",
      action:
        "Please review your anti-sickness medication — make sure you're taking it regularly rather than only when sick. Call your 24-hour helpline today if it doesn't improve.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "Able to eat and drink a reasonable amount.",
      matches: (f) => f.nauseaIntakeLevel === "eating_drinking_normally",
      action:
        "Keep taking any prescribed anti-sickness medication regularly. Call your helpline if you're finding it harder to eat or drink.",
    },
  ],
};
