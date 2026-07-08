import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 4 (Chest
 * Pain). The source is explicit that there is no lower tier to grade:
 * "Advise Urgent A&E assessment for all symptoms of chest pain... Treat
 * chest pain as Red until proven to be non-cardiac/life threatening."
 * Patients on 5-FU/capecitabine are specifically flagged as at risk of
 * drug-induced coronary spasm. No screening fields are needed — any
 * mention of chest pain grades Red immediately, matching the source's
 * "treat as Red until proven otherwise" instruction rather than trying to
 * triage cardiac vs. non-cardiac causes from a chat message.
 */
export const chestPainGuideline: ToxicityGuideline = {
  id: "chest_pain",
  displayName: "Chest pain",
  aliases: ["chest tightness", "chest discomfort"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [],
  grades: [
    {
      grade: "RED",
      label: "Any chest pain",
      description: "Any new chest pain during cancer treatment.",
      matches: () => true,
      action:
        "Chest pain during cancer treatment needs urgent assessment — please go to A&E now or call 999. If you're on an infusion pump or taking capecitabine tablets, stop it and tell your team as soon as you can.",
    },
  ],
};
