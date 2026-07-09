import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 11
 * (Nausea). Only 3 tiers in the source — graded by oral intake rather
 * than the sensation of nausea itself, since intake is what actually
 * drives urgency (dehydration/malnutrition risk).
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const nauseaGuideline: ToxicityGuideline = {
  id: "nausea",
  // EN: "Nausea"
  displayName: "בחילה",
  // EN: ["feeling sick", "queasy", "nauseous"]
  aliases: ["מרגיש רע בבטן", "בחילות", "מבחיל"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "nauseaIntakeLevel",
      // EN: "Are you able to eat and drink a reasonable amount, is your
      // intake reduced but still something, or are you unable to keep any
      // food or fluids down?"
      question:
        "האם את/ה מסוגל/ת לאכול ולשתות כמות סבירה, האם הכמות שאת/ה מצליח/ה לצרוך מופחתת אך עדיין קיימת, או שאינך מצליח/ה להחזיק בכלל אוכל או נוזלים?",
      type: "enum",
      enumOptions: ["eating_drinking_normally", "decreased_intake", "no_intake"],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "Inadequate or no oral fluid/food intake."
      description: "צריכת נוזלים/מזון דרך הפה בלתי מספקת או שאינה קיימת כלל.",
      matches: (f) => f.nauseaIntakeLevel === "no_intake",
      // EN: "This needs same-day assessment for fluids and different
      // anti-sickness medication. Please call your 24-hour helpline now or go
      // to your same-day emergency care unit."
      action:
        "זה מצריך הערכה באותו יום לצורך מתן נוזלים ותרופה שונה נגד בחילה. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה, או לך/י ליחידת הטיפול הדחוף באותו יום.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "Oral intake decreased, without significant weight loss or dehydration yet."
      description: "צריכה דרך הפה מופחתת, עדיין ללא ירידה משמעותית במשקל או התייבשות.",
      matches: (f) => f.nauseaIntakeLevel === "decreased_intake",
      // EN: "Please review your anti-sickness medication — make sure you're
      // taking it regularly rather than only when sick. Call your 24-hour
      // helpline today if it doesn't improve."
      action:
        "אנא בדוק/י מחדש את התרופות נגד בחילה שלך — ודא/י שאת/ה נוטל/ת אותן באופן קבוע ולא רק כשמרגיש/ה רע. התקשר/י היום לקו החירום הפעיל 24 שעות ביממה אם המצב לא משתפר.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "Able to eat and drink a reasonable amount."
      description: "מסוגל/ת לאכול ולשתות כמות סבירה.",
      matches: (f) => f.nauseaIntakeLevel === "eating_drinking_normally",
      // EN: "Keep taking any prescribed anti-sickness medication regularly.
      // Call your helpline if you're finding it harder to eat or drink."
      action:
        "המשך/י ליטול כל תרופה נגד בחילה שנקבעה לך באופן קבוע. התקשר/י לקו החירום אם קשה לך יותר לאכול או לשתות.",
    },
  ],
};
