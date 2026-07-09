import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 7
 * (Dyspnoea/Shortness of Breath). The source explicitly redirects
 * immunotherapy patients to Guideline 24 (immunotherapy-induced
 * pneumonitis), which is one of the excluded lab/imaging-based irAE
 * algorithms — so patients on/recently treated with immunotherapy are
 * routed to the generic excluded-condition fallback instead of the
 * standard tiers below, per the app's scope boundary.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const dyspnoeaGuideline: ToxicityGuideline = {
  id: "dyspnoea",
  // EN: "Dyspnoea / shortness of breath"
  displayName: "קוצר נשימה",
  // EN: ["breathless", "short of breath", "can't catch my breath", "sob"]
  aliases: ["קשה לי לנשום", "נשימה קצרה", "לא מצליח לנשום"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "excluded_condition_fallback",
  },
  screeningFields: [
    {
      id: "dyspnoeaSeverity",
      // EN: "Is the breathlessness new, and how much activity brings it
      // on — none (baseline normal), only with moderate activity, with
      // minimal activity, or even at rest?"
      question:
        "האם קוצר הנשימה חדש, ומהי כמות הפעילות שגורמת לו — ללא (רגיל אצלך), רק במאמץ בינוני, במאמץ קל, או אפילו במנוחה?",
      type: "enum",
      enumOptions: ["none", "moderate_exertion", "minimal_exertion", "at_rest", "life_threatening"],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Life-threatening symptoms requiring urgent intervention."
      description: "תסמינים מסכני חיים המצריכים התערבות דחופה.",
      matches: (f) => f.dyspnoeaSeverity === "life_threatening",
      // EN: "This is a medical emergency. Call 999 or go to A&E now."
      action: "זהו מצב חירום רפואי. התקשר/י ל-999 או לך/י מיד למיון.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "New onset dyspnoea at rest."
      description: "קוצר נשימה חדש שמופיע גם במנוחה.",
      matches: (f) => f.dyspnoeaSeverity === "at_rest",
      // EN: "Breathlessness at rest needs urgent assessment. Please go to A&E
      // now or call your 24-hour helpline immediately."
      action:
        "קוצר נשימה במנוחה מצריך הערכה דחופה. אנא לך/י מיד למיון או התקשר/י מיד לקו החירום הפעיל 24 שעות ביממה.",
    },
    {
      grade: "RED",
      // EN: "Grade 2 (Red)"
      label: "דרגה 2 (אדום)",
      // EN: "New onset dyspnoea with minimal exertion."
      description: "קוצר נשימה חדש במאמץ קל.",
      matches: (f) => f.dyspnoeaSeverity === "minimal_exertion",
      // EN: "This needs same-day assessment. Please call your 24-hour helpline
      // now or go to A&E."
      action:
        "זה מצריך הערכה באותו יום. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה או לך/י למיון.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 1 (Amber)"
      label: "דרגה 1 (כתום)",
      // EN: "New onset dyspnoea with moderate exertion."
      description: "קוצר נשימה חדש במאמץ בינוני.",
      matches: (f) => f.dyspnoeaSeverity === "moderate_exertion",
      // EN: "Please call your 24-hour helpline today to discuss this — it's
      // important your team knows about new breathlessness, especially if
      // you also have a cough, fever, or leg swelling."
      action:
        "אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לדבר על כך — חשוב שהצוות המטפל שלך יידע על קוצר נשימה חדש, במיוחד אם יש לך גם שיעול, חום, או נפיחות ברגליים.",
    },
    {
      grade: "GREEN",
      // EN: "None"
      label: "ללא",
      // EN: "No change in breathlessness from your normal baseline."
      description: "אין שינוי בקוצר הנשימה לעומת המצב הרגיל שלך.",
      matches: (f) => f.dyspnoeaSeverity === "none",
      // EN: "No specific action needed for breathlessness right now."
      action: "אין צורך בפעולה מיוחדת בנוגע לקוצר נשימה כרגע.",
    },
  ],
};
