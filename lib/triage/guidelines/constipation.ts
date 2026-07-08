import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 5
 * (Constipation).
 */
export const constipationGuideline: ToxicityGuideline = {
  id: "constipation",
  displayName: "Constipation",
  aliases: ["can't go", "not opened bowels", "bunged up"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "hoursSinceBowelMovement",
      question:
        "How many hours has it been since your bowels last opened (compared to what's normal for you)?",
      type: "number",
      required: true,
    },
    {
      id: "hasAbdominalPainOrVomiting",
      question: "Do you have any abdominal pain or vomiting alongside this?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasObstructionSymptoms",
      question:
        "Do you have severe abdominal pain or swelling, vomiting, or vomit that smells like faeces?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description:
        "No bowel movement for 96+ hours, or symptoms of bowel obstruction.",
      matches: (f) =>
        (typeof f.hoursSinceBowelMovement === "number" &&
          f.hoursSinceBowelMovement >= 96) ||
        f.hasObstructionSymptoms === true,
      action:
        "This could be a bowel obstruction, which needs urgent assessment. Please go to A&E now or call your 24-hour helpline immediately.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description: "No bowel movement for 72-95 hours.",
      matches: (f) =>
        typeof f.hoursSinceBowelMovement === "number" &&
        f.hoursSinceBowelMovement >= 72,
      action:
        "This has gone on long enough that it needs same-day assessment. Please call your 24-hour helpline now.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "No bowel movement for 48-71 hours.",
      matches: (f) =>
        typeof f.hoursSinceBowelMovement === "number" &&
        f.hoursSinceBowelMovement >= 48,
      action:
        "Please increase your fluids and review your medication — some anti-sickness tablets and painkillers can cause this. Call your 24-hour helpline today to talk through laxative options.",
      escalateIf: [
        {
          condition: (f) => f.hasAbdominalPainOrVomiting === true,
          escalateTo: "RED",
          reason: "you also have abdominal pain or vomiting alongside this",
        },
      ],
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "No bowel movement for under 48 hours over your normal pattern.",
      matches: (f) =>
        typeof f.hoursSinceBowelMovement === "number" &&
        f.hoursSinceBowelMovement < 48,
      action:
        "This is common during treatment. Drink plenty of fluids and keep an eye on it — call your helpline if it continues past 48 hours or you get any pain.",
    },
  ],
};
