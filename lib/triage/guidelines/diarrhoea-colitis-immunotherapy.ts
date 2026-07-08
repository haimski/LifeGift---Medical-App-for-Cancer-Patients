import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 21
 * (Immune-Related Adverse Event: Diarrhoea & Colitis).
 *
 * The source guideline's Moderate/Severe tiers call for investigations a
 * patient can't self-report (CMV PCR, faecal calprotectin, endoscopy) and
 * treatments (steroids, infliximab) that require in-person clinical
 * assessment. Rather than attempt that algorithm from a chat message, this
 * mirrors the app's scope boundary for excluded lab-based conditions: any
 * symptom picture beyond the mildest tier is graded Red and pointed at the
 * oncology team, instead of trying to arbitrate the underlying clinical
 * decision. This is a deliberately conservative simplification, not the
 * full guideline — see README's scope-boundary section.
 */
export const diarrhoeaColitisImmunotherapyGuideline: ToxicityGuideline = {
  id: "diarrhoea_colitis_immunotherapy",
  displayName: "Diarrhoea (on immunotherapy)",
  aliases: ["diarrhea", "loose stools", "the runs", "watery stools", "colitis"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "stoolsPerDayOverBaseline",
      question:
        "How many more bowel movements than your usual amount have you had today?",
      type: "number",
      required: true,
    },
    {
      id: "hasAbdominalPainOrCramping",
      question: "Do you have any abdominal pain or cramping?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasMucusOrBloodInStool",
      question: "Is there any mucus or blood in your stool?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasFeverOrDehydrationOrIncontinence",
      question:
        "Do you have a fever, signs of dehydration, or any incontinence alongside this?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Severe (Grade 3-4)",
      description:
        "7 or more episodes a day over baseline, or fever/dehydration/incontinence alongside diarrhoea.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 7) ||
        f.hasFeverOrDehydrationOrIncontinence === true,
      action:
        "Because you're on immunotherapy, this level of diarrhoea needs urgent same-day assessment. Please call your 24-hour oncology helpline now or go to A&E — this may need treatment your team can only give in person.",
    },
    {
      grade: "RED",
      label: "Moderate (Grade 2)",
      description:
        "4-6 episodes a day over baseline, or any abdominal pain/cramping, or mucus/blood in stool.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 4) ||
        f.hasAbdominalPainOrCramping === true ||
        f.hasMucusOrBloodInStool === true,
      action:
        "Because you're on immunotherapy, diarrhoea with pain, mucus/blood, or this frequency needs same-day assessment by your oncology team — it may need tests and treatment that can't be done over the phone. Please call your 24-hour helpline now.",
    },
    {
      grade: "AMBER",
      label: "Mild (Grade 1)",
      description:
        "Fewer than 4 episodes a day over baseline, with no abdominal pain, mucus, or blood.",
      matches: (f) =>
        typeof f.stoolsPerDayOverBaseline === "number" &&
        f.stoolsPerDayOverBaseline >= 1 &&
        f.stoolsPerDayOverBaseline < 4,
      action:
        "Drink plenty of fluids and avoid high-fibre or lactose foods for now. Because you're on immunotherapy, please still call your 24-hour helpline today so your team knows and can advise on your next dose.",
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
