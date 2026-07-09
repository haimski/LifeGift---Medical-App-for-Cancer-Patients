import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 17
 * (Vomiting). Grading is a direct 24-hour episode count, as in the
 * source table; the source text separately recommends assessing hydration
 * qualitatively but doesn't attach a strict numeric escalation trigger to
 * it, so that isn't encoded as a hard rule here.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const vomitingGuideline: ToxicityGuideline = {
  id: "vomiting",
  // EN: "Vomiting"
  displayName: "הקאות",
  // EN: ["being sick", "throwing up", "sickness"]
  aliases: ["הקאה", "מקיא", "בחילה עם הקאה"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "vomitingEpisodesLast24h",
      // EN: "How many times have you been sick in the last 24 hours?"
      question: "כמה פעמים הקאת ב-24 השעות האחרונות?",
      type: "number",
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "More than 10 episodes in 24 hours. Life-threatening consequences."
      description: "יותר מ-10 פעמים ב-24 שעות. השלכות מסכנות חיים.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h > 10,
      // EN: "This is a medical emergency. Go to A&E now or call 999 — this
      // level of vomiting can be life-threatening, especially during cancer
      // treatment."
      action:
        "זהו מצב חירום רפואי. לך/י מיד למיון או התקשר/י ל-999 — רמת הקאות זו עלולה לסכן חיים, במיוחד במהלך טיפול בסרטן.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "6-10 episodes in 24 hours. Acute hospital assessment indicated."
      description: "6-10 פעמים ב-24 שעות. נדרשת הערכה דחופה בבית חולים.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h >= 6,
      // EN: "This needs assessment in person today. Please contact your
      // 24-hour helpline now or go to your same-day emergency care unit — you
      // may need fluids and different anti-sickness medication given
      // directly."
      action:
        "זה מצריך הערכה פיזית היום. אנא פנה/י עכשיו לקו החירום הפעיל 24 שעות ביממה, או לך/י ליחידת הטיפול הדחוף באותו יום — ייתכן שתזדקק/י לנוזלים ולתרופה שונה נגד בחילה שתינתן ישירות.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "3-5 episodes in 24 hours. Medical intervention indicated."
      description: "3-5 פעמים ב-24 שעות. נדרשת התערבות רפואית.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h >= 3,
      // EN: "This is enough vomiting that your team should know about today.
      // Keep sipping fluids, keep taking any anti-sickness medication as
      // prescribed, and call your 24-hour helpline now to discuss it."
      action:
        "זו כמות הקאות שהצוות המטפל שלך צריך לדעת עליה היום. המשך/י ללגום נוזלים, המשך/י ליטול תרופות נגד בחילה כפי שנקבע, והתקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה כדי לדבר על כך.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "1-2 episodes in 24 hours. No intervention indicated."
      description: "1-2 פעמים ב-24 שעות. אין צורך בהתערבות.",
      matches: (f) =>
        typeof f.vomitingEpisodesLast24h === "number" &&
        f.vomitingEpisodesLast24h <= 2,
      // EN: "Keep an eye on it and stay hydrated. If you're on anti-sickness
      // medication, keep taking it as prescribed. Call your helpline if it
      // gets worse or doesn't settle in 24 hours."
      action:
        "עקוב/י אחר המצב והקפד/י לשתות מספיק. אם את/ה נוטל/ת תרופה נגד בחילה, המשך/י ליטול אותה כפי שנקבע. התקשר/י לקו החירום אם המצב מחמיר או לא משתפר תוך 24 שעות.",
    },
  ],
};
