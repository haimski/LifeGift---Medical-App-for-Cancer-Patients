import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 34
 * (Extravasation). The source treats any suspected extravasation as an
 * immediate action item: stop the infusion, leave the cannula/line in
 * place, tell a senior member of staff right away. Per the app's scope
 * decision, this is a simple immediate Amber alert rather than a full
 * grading — the point is to get the patient telling clinical staff
 * immediately (most patients describing this are still connected to an
 * infusion or very recently were, so "tell your nurse/team right now" is
 * the correct first action, not necessarily a 999/A&E call).
 */
export const extravasationGuideline: ToxicityGuideline = {
  id: "extravasation",
  displayName: "Suspected extravasation (drug leaking around a drip/line)",
  aliases: ["drip leaking", "cannula pain", "line leaking", "infusion site pain"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [],
  grades: [
    {
      grade: "AMBER",
      label: "Any suspected extravasation",
      description:
        "Pain, swelling, redness, or leaking around a cannula, line, or infusion site.",
      matches: () => true,
      action:
        "If you're still connected to your infusion, stop it now and tell a nurse or your treatment team immediately — don't wait. Leave the cannula/line in place so they can check it. If you're at home and this started after you left the clinic, call your 24-hour helpline right away.",
    },
  ],
};
