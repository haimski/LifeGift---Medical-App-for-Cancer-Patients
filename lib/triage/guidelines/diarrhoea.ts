import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 6
 * (Diarrhoea) — non-immunotherapy pathway. Patients on/recently treated
 * with immunotherapy are redirected via `alternatePathwayIf` to the
 * colitis-aware guideline instead, since the source document treats that
 * as a materially different (and more cautious) algorithm.
 */
export const diarrhoeaGuideline: ToxicityGuideline = {
  id: "diarrhoea",
  displayName: "Diarrhoea",
  aliases: ["diarrhea", "loose stools", "the runs", "watery stools"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "diarrhoea_colitis_immunotherapy",
  },
  screeningFields: [
    {
      id: "stoolsPerDayOverBaseline",
      question:
        "How many more bowel movements than your usual amount have you had today?",
      type: "number",
      required: true,
    },
    {
      id: "hasBloodInStool",
      question: "Is there any blood in your stool?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasIncontinence",
      question: "Have you had any accidents / incontinence?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasSevereCramping",
      question: "Do you have severe cramping pain?",
      type: "boolean",
      required: false,
    },
    {
      id: "persistedDespiteMedication24h",
      question:
        "Has this continued for more than 24 hours despite taking anti-diarrhoeal medication?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasFeverOrOtherSymptoms",
      question:
        "Do you also have a temperature, nausea/vomiting, or mouth ulcers alongside the diarrhoea?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "10 or more episodes a day, or grossly bloody diarrhoea.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 10) ||
        f.hasBloodInStool === true,
      action:
        "This is severe and needs assessment in person today. Please call your 24-hour oncology helpline now or go to your same-day emergency care unit / A&E.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description:
        "7-9 episodes a day, or any incontinence, severe cramping.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 7) ||
        f.hasIncontinence === true ||
        f.hasSevereCramping === true,
      action:
        "This is severe and needs assessment in person today. Please call your 24-hour oncology helpline now or go to your same-day emergency care unit / A&E.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description:
        "4-6 episodes a day over your usual amount, any nocturnal bowel movements, or moderate cramping.",
      matches: (f) =>
        typeof f.stoolsPerDayOverBaseline === "number" &&
        f.stoolsPerDayOverBaseline >= 4,
      action:
        "Please hold off any chemotherapy tablets you take at home until your team has discussed this with you. Drink plenty of fluids, and call your 24-hour helpline today to talk through your medication.",
      escalateIf: [
        {
          condition: (f) => f.persistedDespiteMedication24h === true,
          escalateTo: "RED",
          reason:
            "this hasn't improved in 24 hours despite anti-diarrhoeal medication",
        },
        {
          condition: (f) => f.hasFeverOrOtherSymptoms === true,
          escalateTo: "RED",
          reason: "you also have other symptoms alongside the diarrhoea",
        },
      ],
    },
    {
      grade: "AMBER",
      label: "Grade 1 (Amber)",
      description: "Up to 3 bowel movements a day over your usual amount.",
      matches: (f) =>
        typeof f.stoolsPerDayOverBaseline === "number" &&
        f.stoolsPerDayOverBaseline >= 1,
      action:
        "Drink plenty of fluids and keep an eye on it. Call your 24-hour helpline if it continues or gets worse over the next 24 hours.",
    },
    {
      grade: "GREEN",
      label: "None",
      description: "No increase in bowel movements from your usual pattern.",
      matches: (f) => f.stoolsPerDayOverBaseline === 0,
      action: "No specific action needed for diarrhoea right now.",
    },
  ],
};
