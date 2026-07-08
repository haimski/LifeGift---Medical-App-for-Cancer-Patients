import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 17
 * (Vomiting). Grading is a direct 24-hour episode count, as in the
 * source table; the source text separately recommends assessing hydration
 * qualitatively but doesn't attach a strict numeric escalation trigger to
 * it, so that isn't encoded as a hard rule here.
 */
export const vomitingGuideline: ToxicityGuideline = {
  id: "vomiting",
  displayName: "Vomiting",
  aliases: ["being sick", "throwing up", "sickness"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "vomitingEpisodesLast24h",
      question: "How many times have you been sick in the last 24 hours?",
      type: "number",
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description:
        "More than 10 episodes in 24 hours. Life-threatening consequences.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h > 10,
      action:
        "This is a medical emergency. Go to A&E now or call 999 — this level of vomiting can be life-threatening, especially during cancer treatment.",
    },
    {
      grade: "RED",
      label: "Grade 3 (Red)",
      description:
        "6-10 episodes in 24 hours. Acute hospital assessment indicated.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h >= 6,
      action:
        "This needs assessment in person today. Please contact your 24-hour helpline now or go to your same-day emergency care unit — you may need fluids and different anti-sickness medication given directly.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "3-5 episodes in 24 hours. Medical intervention indicated.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h >= 3,
      action:
        "This is enough vomiting that your team should know about today. Keep sipping fluids, keep taking any anti-sickness medication as prescribed, and call your 24-hour helpline now to discuss it.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "1-2 episodes in 24 hours. No intervention indicated.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h <= 2,
      action:
        "Keep an eye on it and stay hydrated. If you're on anti-sickness medication, keep taking it as prescribed. Call your helpline if it gets worse or doesn't settle in 24 hours.",
    },
  ],
};
