import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 2
 * (Arthralgia/Myalgia). The source explicitly redirects immunotherapy
 * patients to Guideline 27 (immune-related arthralgia/myalgia, which can
 * progress to myositis/myocarditis) — one of the excluded irAE
 * algorithms requiring CK/ESR/troponin bloods — so those patients are
 * routed to the generic excluded-condition fallback instead.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const arthralgiaMyalgiaGuideline: ToxicityGuideline = {
  id: "arthralgia_myalgia",
  // EN: "Joint / muscle pain"
  displayName: "כאבי מפרקים / שרירים",
  // EN: ["joint pain", "muscle pain", "myalgia", "arthralgia", "aching joints"]
  aliases: ["כאב מפרקים", "כאב שרירים", "מפרקים כואבים", "שרירים כואבים"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "excluded_condition_fallback",
  },
  screeningFields: [
    {
      id: "painInterferenceLevel",
      // EN: "How much is the pain affecting your daily activities — not
      // interfering at all, interfering with some activities, severe pain or
      // loss of ability to do some things, or are you bedridden?"
      question:
        "עד כמה הכאב משפיע על הפעילויות היומיומיות שלך — לא מפריע בכלל, מפריע לחלק מהפעילויות, כאב חמור או אובדן יכולת לבצע דברים מסוימים, או שאת/ה מרותק/ת למיטה?",
      type: "enum",
      enumOptions: ["none_or_mild", "moderate", "severe", "bedridden"],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Bedridden or disabling."
      description: "מרותק/ת למיטה או כאב משבית.",
      matches: (f) => f.painInterferenceLevel === "bedridden",
      // EN: "Please call your 24-hour helpline now, or go to your same-day
      // emergency care unit, for urgent pain relief and assessment."
      action:
        "אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה, או לך/י ליחידת הטיפול הדחוף באותו יום, לצורך הקלה דחופה בכאב והערכה.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "Severe pain and/or loss of ability to perform some activities."
      description: "כאב חמור ו/או אובדן יכולת לבצע חלק מהפעילויות.",
      matches: (f) => f.painInterferenceLevel === "severe",
      // EN: "Please call your 24-hour helpline today — you may need stronger
      // pain relief and a check that this isn't something needing urgent
      // treatment."
      action:
        "אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה — ייתכן שתזדקק/י להקלה חזקה יותר בכאב ולבדיקה שאין מדובר במשהו המצריך טיפול דחוף.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "Moderate pain, interfering with some normal activities."
      description: "כאב בינוני, המפריע לחלק מהפעילויות הרגילות.",
      matches: (f) => f.painInterferenceLevel === "moderate",
      // EN: "Try heat (a heat pad or warm bath) and review your pain relief.
      // Call your 24-hour helpline today, and let them know if you also
      // develop a temperature."
      action:
        "נסה/י חום (כרית חימום או אמבטיה חמה) ובדוק/י מחדש את משכך הכאבים שלך. התקשר/י היום לקו החירום הפעיל 24 שעות ביממה, ועדכן/י אותם אם מתפתח לך גם חום.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "Mild pain, not interfering with daily activities."
      description: "כאב קל, שאינו מפריע לפעילויות היומיומיות.",
      matches: (f) => f.painInterferenceLevel === "none_or_mild",
      // EN: "This is common during treatment. Simple pain relief and rest
      // should help — call your helpline if it worsens or you develop a
      // temperature."
      action:
        "זה נפוץ במהלך הטיפול. משכך כאבים פשוט ומנוחה אמורים לעזור — התקשר/י לקו החירום אם זה מחמיר או שמתפתח לך חום.",
    },
  ],
};
