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
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const extravasationGuideline: ToxicityGuideline = {
  id: "extravasation",
  // EN: "Suspected extravasation (drug leaking around a drip/line)"
  displayName: "חשד לדליפת תרופה מהוריד (extravasation)",
  // EN: ["drip leaking", "line leaking", "cannula pain", "infusion site pain"]
  aliases: ["דליפה מהעירוי", "דליפה מהקו", "כאב בקנולה", "כאב במקום העירוי"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [],
  grades: [
    {
      grade: "AMBER",
      // EN: "Any suspected extravasation"
      label: "כל חשד לדליפת תרופה מהוריד",
      // EN: "Pain, swelling, redness, or leaking around a cannula, line, or infusion site."
      description: "כאב, נפיחות, אדמומיות, או דליפה סביב קנולה, קו עירוי, או מקום העירוי.",
      matches: () => true,
      // EN: "If you're still connected to your infusion, stop it now and tell
      // a nurse or your treatment team immediately — don't wait. Leave the
      // cannula/line in place so they can check it. If you're at home and
      // this started after you left the clinic, call your 24-hour helpline
      // right away."
      action:
        "אם עדיין את/ה מחובר/ת לעירוי, הפסק/י אותו עכשיו ועדכן/י מיד אחות או את הצוות המטפל — אל תמתין/י. השאר/י את הקנולה/הקו במקום כדי שיוכלו לבדוק אותם. אם את/ה בבית וזה התחיל אחרי שעזבת את המרפאה, התקשר/י מיד לקו החירום הפעיל 24 שעות ביממה.",
    },
  ],
};
