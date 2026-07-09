import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 10
 * (Mucositis/Stomatitis/Oesophagitis).
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const mucositisGuideline: ToxicityGuideline = {
  id: "mucositis",
  // EN: "Mouth/mucositis"
  displayName: "פה / דלקת רירית הפה",
  // EN: ["mouth ulcers", "sore mouth", "stomatitis", "oesophagitis"]
  aliases: ["פצעים בפה", "כאב בפה", "דלקת בפה", "דלקת בוושט"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "mouthSeverity",
      // EN: "Are you able to eat and drink normally? Would you describe your
      // mouth as: painless or mild soreness (eating fine), painful but still
      // eating/drinking okay, painful and finding it hard to eat/drink, or so
      // painful you can barely take anything in?"
      question:
        "האם את/ה מסוגל/ת לאכול ולשתות כרגיל? כיצד היית מתאר/ת את הפה שלך: ללא כאב או כאב קל (אוכל/ת בסדר), כואב אך עדיין מצליח/ה לאכול/לשתות, כואב וקשה לאכול/לשתות, או כואב כל כך שכמעט ולא מצליח/ה לצרוך דבר?",
      type: "enum",
      enumOptions: [
        "painless_eating_normally",
        "painful_eating_ok",
        "painful_difficulty_eating",
        "severe_minimal_intake",
      ],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Significant pain, minimal intake and/or reduced urine output."
      description: "כאב משמעותי, צריכה מינימלית ו/או ירידה בהטלת שתן.",
      matches: (f) => f.mouthSeverity === "severe_minimal_intake",
      // EN: "This needs assessment today — you may need fluids and pain
      // relief your team can only give in person. Please call your 24-hour
      // helpline now or go to your same-day emergency care unit."
      action:
        "זה מצריך הערכה היום — ייתכן שתזדקק/י לנוזלים ולהקלה בכאב שהצוות המטפל שלך יכול לתת רק פנים אל פנים. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה, או לך/י ליחידת הטיפול הדחוף באותו יום.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "Painful erythema, and difficulty eating and drinking."
      description: "אדמומיות כואבת, וקושי לאכול ולשתות.",
      matches: (f) => f.mouthSeverity === "painful_difficulty_eating",
      // EN: "Please call your 24-hour helpline today — you may need stronger
      // pain relief and a check for infection or dehydration."
      action:
        "אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה — ייתכן שתזדקק/י להקלה חזקה יותר בכאב ולבדיקה לזיהום או התייבשות.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "Painful ulcers/erythema, mild soreness, but eating and drinking normally."
      description: "פצעים/אדמומיות כואבים, כאב קל, אך אוכל/ת ושותה/שותה כרגיל.",
      matches: (f) => f.mouthSeverity === "painful_eating_ok",
      // EN: "Try ice chips for relief and an anti-inflammatory mouthwash if
      // you have one. Call your 24-hour helpline today so your team knows,
      // especially if you're due chemotherapy soon."
      action:
        "נסה/י קרח מרוסק להקלה, ושטיפת פה נגד דלקת אם יש לך. התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי שהצוות המטפל שלך יידע, במיוחד אם מתוכננת לך כימותרפיה בקרוב.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "Painless ulcers, erythema, or mild soreness — eating and drinking normally."
      description: "פצעים או אדמומיות ללא כאב, או כאב קל — אוכל/ת ושותה כרגיל.",
      matches: (f) => f.mouthSeverity === "painless_eating_normally",
      // EN: "Keep up gentle mouth care and stay hydrated. Call your helpline
      // if it becomes painful or you notice white patches (possible thrush)."
      action:
        "המשך/י בטיפול פה עדין והקפד/י על שתייה מספקת. התקשר/י לקו החירום אם זה נעשה כואב או שאת/ה מבחין/ה בכתמים לבנים (אפשרות לפטרת).",
    },
  ],
};
