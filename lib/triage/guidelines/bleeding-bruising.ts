import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 3
 * (Bleeding and/or Bruising). The source grades bleeding by units of
 * blood lost (1-2 / 3-4 / >4 units), which a patient can't self-report —
 * this maps that to patient-observable severity language instead
 * (controlled vs. ongoing vs. won't stop) and treats it, and any spread
 * of bruising beyond a localised area, as at least Red, in keeping with
 * the source's low threshold for concern in myelosuppressed patients.
 */
export const bleedingBruisingGuideline: ToxicityGuideline = {
  id: "bleeding_bruising",
  displayName: "Bleeding / bruising",
  aliases: ["bleeding", "bruising", "bruises", "won't stop bleeding"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "bleedingSeverity",
      question:
        "Are you bleeding from anywhere right now? Would you say: no bleeding, a small amount that's stopped or stops with pressure, a significant amount that's ongoing, or severe bleeding that won't stop?",
      type: "enum",
      enumOptions: ["none", "minor_controlled", "significant", "severe_uncontrolled"],
      required: true,
    },
    {
      id: "bruisingSpread",
      question:
        "Do you have any new bruising — none, a few small bruises in one area, or bruising that's widespread or appeared without any injury?",
      type: "enum",
      enumOptions: ["none", "localised", "widespread_or_spontaneous"],
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "Life-threatening haemorrhage / severe bleeding that won't stop.",
      matches: (f) => f.bleedingSeverity === "severe_uncontrolled",
      action:
        "This sounds like it could be a life-threatening bleed. Call 999 or go to A&E now.",
    },
    {
      grade: "RED",
      label: "Grade 2-3 (Red)",
      description:
        "Ongoing significant bleeding, or widespread/spontaneous bruising.",
      matches: (f) =>
        f.bleedingSeverity === "significant" ||
        f.bruisingSpread === "widespread_or_spontaneous",
      action:
        "This needs urgent same-day assessment — it could be related to your platelet count. Please call your 24-hour helpline now or go to A&E.",
    },
    {
      grade: "AMBER",
      label: "Grade 1 (Amber)",
      description:
        "Minor bleeding controlled by pressure, or localised bruising.",
      matches: (f) =>
        f.bleedingSeverity === "minor_controlled" || f.bruisingSpread === "localised",
      action:
        "Keep an eye on it and apply gentle pressure if it's still bleeding. Call your 24-hour helpline today to mention it, especially if you're on any blood thinners.",
    },
    {
      grade: "GREEN",
      label: "None",
      description: "No bleeding and no new bruising.",
      // Worst-first evaluation means the Red/Amber bruising criteria above
      // are always checked first, so reaching this criterion already
      // implies bruisingSpread was "none" (or unreported).
      matches: (f) => f.bleedingSeverity === "none",
      action: "No specific action needed right now.",
    },
  ],
};
