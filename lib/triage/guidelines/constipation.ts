import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 5
 * (Constipation).
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const constipationGuideline: ToxicityGuideline = {
  id: "constipation",
  // EN: "Constipation"
  displayName: "עצירות",
  // EN: ["can't go", "not opened bowels", "bunged up"]
  aliases: ["לא הצלחתי לעשות צרכים", "המעיים לא נפתחים", "קשה לי לעשות צרכים"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "hoursSinceBowelMovement",
      // EN: "How many hours has it been since your bowels last opened
      // (compared to what's normal for you)?"
      question: "כמה שעות עברו מאז היציאה האחרונה שלך (בהשוואה לרגיל אצלך)?",
      type: "number",
      required: true,
    },
    {
      id: "hasAbdominalPainOrVomiting",
      // EN: "Do you have any abdominal pain or vomiting alongside this?"
      question: "האם יש לך כאבי בטן או הקאות יחד עם זה?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasObstructionSymptoms",
      // EN: "Do you have severe abdominal pain or swelling, vomiting, or vomit that smells like faeces?"
      question: "האם יש לך כאב בטן חמור או נפיחות, הקאות, או הקאה שמריחה כמו צואה?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "No bowel movement for 96+ hours, or symptoms of bowel obstruction."
      description: "ללא יציאה במשך 96 שעות ומעלה, או תסמינים של חסימת מעיים.",
      matches: (f) =>
        (typeof f.hoursSinceBowelMovement === "number" &&
          f.hoursSinceBowelMovement >= 96) ||
        f.hasObstructionSymptoms === true,
      // EN: "This could be a bowel obstruction, which needs urgent assessment.
      // Please go to A&E now or call your 24-hour helpline immediately."
      action:
        "ייתכן שמדובר בחסימת מעיים, המצריכה הערכה דחופה. אנא לך/י מיד למיון או התקשר/י מיד לקו החירום הפעיל 24 שעות ביממה.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "No bowel movement for 72-95 hours."
      description: "ללא יציאה במשך 72-95 שעות.",
      matches: (f) =>
        typeof f.hoursSinceBowelMovement === "number" &&
        f.hoursSinceBowelMovement >= 72,
      // EN: "This has gone on long enough that it needs same-day assessment.
      // Please call your 24-hour helpline now."
      action:
        "זה נמשך מספיק זמן כדי לדרוש הערכה באותו יום. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "No bowel movement for 48-71 hours."
      description: "ללא יציאה במשך 48-71 שעות.",
      matches: (f) =>
        typeof f.hoursSinceBowelMovement === "number" &&
        f.hoursSinceBowelMovement >= 48,
      // EN: "Please increase your fluids and review your medication — some
      // anti-sickness tablets and painkillers can cause this. Call your
      // 24-hour helpline today to talk through laxative options."
      action:
        "אנא הגבר/י את צריכת הנוזלים ובדוק/י מחדש את התרופות שלך — חלק מהתרופות נגד בחילה ומשככי הכאבים עלולים לגרום לכך. התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לדבר על אפשרויות משלשל.",
      escalateIf: [
        {
          condition: (f) => f.hasAbdominalPainOrVomiting === true,
          escalateTo: "RED",
          // EN: "you also have abdominal pain or vomiting alongside this"
          reason: "יש לך גם כאבי בטן או הקאות יחד עם זה",
        },
      ],
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "No bowel movement for under 48 hours over your normal pattern."
      description: "ללא יציאה במשך פחות מ-48 שעות מעבר לתבנית הרגילה שלך.",
      matches: (f) =>
        typeof f.hoursSinceBowelMovement === "number" &&
        f.hoursSinceBowelMovement < 48,
      // EN: "This is common during treatment. Drink plenty of fluids and keep
      // an eye on it — call your helpline if it continues past 48 hours or
      // you get any pain."
      action:
        "זה נפוץ במהלך הטיפול. שתה/י הרבה נוזלים ועקוב/י אחר המצב — התקשר/י לקו החירום אם זה נמשך מעבר ל-48 שעות או שיש לך כאב.",
    },
  ],
};
