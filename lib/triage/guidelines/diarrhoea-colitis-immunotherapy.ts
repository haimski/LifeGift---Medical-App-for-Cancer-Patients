import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 21
 * (Immune-Related Adverse Event: Diarrhoea & Colitis).
 *
 * The source guideline's Moderate/Severe tiers call for investigations a
 * patient can't self-report (CMV PCR, faecal calprotectin, endoscopy) and
 * treatments (steroids, infliximab) that require in-person clinical
 * assessment. Rather than attempt that algorithm from a chat message, this
 * mirrors the app's scope boundary for excluded lab-based conditions: any
 * symptom picture beyond the mildest tier is graded Red and pointed at the
 * oncology team, instead of trying to arbitrate the underlying clinical
 * decision. This is a deliberately conservative simplification, not the
 * full guideline — see README's scope-boundary section.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const diarrhoeaColitisImmunotherapyGuideline: ToxicityGuideline = {
  id: "diarrhoea_colitis_immunotherapy",
  // EN: "Diarrhoea (on immunotherapy)"
  displayName: "שלשול (בזמן טיפול באימונותרפיה)",
  // EN: ["diarrhea", "loose stools", "the runs", "watery stools", "colitis"]
  aliases: ["שלשולים", "יציאות רכות", "יציאות מימיות", "בטן רצה", "קוליטיס"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "stoolsPerDayOverBaseline",
      // EN: "How many more bowel movements than your usual amount have you had today?"
      question: "כמה יציאות נוספות מעבר לכמות הרגילה שלך היו לך היום?",
      type: "number",
      required: true,
    },
    {
      id: "hasAbdominalPainOrCramping",
      // EN: "Do you have any abdominal pain or cramping?"
      question: "האם יש לך כאבי בטן או התכווצויות?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasMucusOrBloodInStool",
      // EN: "Is there any mucus or blood in your stool?"
      question: "האם יש ריר או דם בצואה?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasFeverOrDehydrationOrIncontinence",
      // EN: "Do you have a fever, signs of dehydration, or any incontinence alongside this?"
      question: "האם יש לך חום, סימני התייבשות, או בריחת צואה יחד עם זה?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Severe (Grade 3-4)"
      label: "חמור (דרגה 3-4)",
      // EN: "7 or more episodes a day over baseline, or fever/dehydration/incontinence alongside diarrhoea."
      description:
        "7 יציאות ביום או יותר מעבר לרגיל, או חום/התייבשות/בריחת צואה יחד עם השלשול.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 7) ||
        f.hasFeverOrDehydrationOrIncontinence === true,
      // EN: "Because you're on immunotherapy, this level of diarrhoea needs
      // urgent same-day assessment. Please call your 24-hour oncology
      // helpline now or go to A&E — this may need treatment your team can
      // only give in person."
      action:
        "מכיוון שאת/ה מטופל/ת באימונותרפיה, רמת שלשול זו מצריכה הערכה דחופה באותו יום. אנא התקשר/י עכשיו לקו החירום האונקולוגי הפעיל 24 שעות ביממה או לך/י למיון — ייתכן שנדרש טיפול שהצוות שלך יכול לתת רק פנים אל פנים.",
    },
    {
      grade: "RED",
      // EN: "Moderate (Grade 2)"
      label: "בינוני (דרגה 2)",
      // EN: "4-6 episodes a day over baseline, or any abdominal pain/cramping, or mucus/blood in stool."
      description:
        "4-6 יציאות ביום מעבר לרגיל, או כאבי בטן/התכווצויות, או ריר/דם בצואה.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 4) ||
        f.hasAbdominalPainOrCramping === true ||
        f.hasMucusOrBloodInStool === true,
      // EN: "Because you're on immunotherapy, diarrhoea with pain, mucus/blood,
      // or this frequency needs same-day assessment by your oncology team —
      // it may need tests and treatment that can't be done over the phone.
      // Please call your 24-hour helpline now."
      action:
        "מכיוון שאת/ה מטופל/ת באימונותרפיה, שלשול עם כאב, ריר/דם, או בתדירות זו מצריך הערכה באותו יום על ידי הצוות האונקולוגי שלך — ייתכן שיידרשו בדיקות וטיפול שלא ניתן לבצע בטלפון. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה.",
    },
    {
      grade: "AMBER",
      // EN: "Mild (Grade 1)"
      label: "קל (דרגה 1)",
      // EN: "Fewer than 4 episodes a day over baseline, with no abdominal pain, mucus, or blood."
      description: "פחות מ-4 יציאות ביום מעבר לרגיל, ללא כאבי בטן, ריר, או דם.",
      matches: (f) =>
        typeof f.stoolsPerDayOverBaseline === "number" &&
        f.stoolsPerDayOverBaseline >= 1 &&
        f.stoolsPerDayOverBaseline < 4,
      // EN: "Drink plenty of fluids and avoid high-fibre or lactose foods for
      // now. Because you're on immunotherapy, please still call your 24-hour
      // helpline today so your team knows and can advise on your next dose."
      action:
        "שתה/י הרבה נוזלים והימנע/י כרגע ממזונות עשירים בסיבים או בלקטוז. מכיוון שאת/ה מטופל/ת באימונותרפיה, אנא בכל זאת התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי שהצוות שלך יידע ויוכל לייעץ לגבי המנה הבאה.",
    },
    {
      grade: "GREEN",
      // EN: "None"
      label: "ללא",
      // EN: "No increase in bowel movements from your usual pattern."
      description: "אין עלייה בכמות היציאות לעומת התבנית הרגילה שלך.",
      matches: (f) => f.stoolsPerDayOverBaseline === 0,
      // EN: "No specific action needed for diarrhoea right now."
      action: "אין צורך בפעולה מיוחדת בנוגע לשלשול כרגע.",
    },
  ],
};
