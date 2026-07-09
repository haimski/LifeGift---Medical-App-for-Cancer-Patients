import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 6
 * (Diarrhoea) — non-immunotherapy pathway. Patients on/recently treated
 * with immunotherapy are redirected via `alternatePathwayIf` to the
 * colitis-aware guideline instead, since the source document treats that
 * as a materially different (and more cautious) algorithm.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const diarrhoeaGuideline: ToxicityGuideline = {
  id: "diarrhoea",
  // EN: "Diarrhoea"
  displayName: "שלשול",
  // EN: ["diarrhea", "loose stools", "the runs", "watery stools"]
  aliases: ["שלשולים", "יציאות רכות", "יציאות מימיות", "בטן רצה"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "diarrhoea_colitis_immunotherapy",
  },
  screeningFields: [
    {
      id: "stoolsPerDayOverBaseline",
      // EN: "How many more bowel movements than your usual amount have you had today?"
      question: "כמה יציאות נוספות מעבר לכמות הרגילה שלך היו לך היום?",
      type: "number",
      required: true,
    },
    {
      id: "hasBloodInStool",
      // EN: "Is there any blood in your stool?"
      question: "האם יש דם בצואה?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasIncontinence",
      // EN: "Have you had any accidents / incontinence?"
      question: "האם הייתה לך בריחת צואה?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasSevereCramping",
      // EN: "Do you have severe cramping pain?"
      question: "האם יש לך כאבי התכווצויות חזקים?",
      type: "boolean",
      required: false,
    },
    {
      id: "persistedDespiteMedication24h",
      // EN: "Has this continued for more than 24 hours despite taking anti-diarrhoeal medication?"
      question: "האם זה נמשך יותר מ-24 שעות למרות נטילת תרופה נגד שלשולים?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasFeverOrOtherSymptoms",
      // EN: "Do you also have a temperature, nausea/vomiting, or mouth ulcers alongside the diarrhoea?"
      question: "האם יש לך גם חום, בחילה/הקאות, או פצעים בפה יחד עם השלשול?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "10 or more episodes a day, or grossly bloody diarrhoea."
      description: "10 יציאות ביום או יותר, או שלשול עם דם ניכר.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 10) ||
        f.hasBloodInStool === true,
      // EN: "This is severe and needs assessment in person today. Please call
      // your 24-hour oncology helpline now or go to your same-day emergency
      // care unit / A&E."
      action:
        "זהו מצב חמור המצריך הערכה פיזית היום. אנא התקשר/י עכשיו לקו החירום האונקולוגי הפעיל 24 שעות ביממה, או לך/י ליחידת הטיפול הדחוף באותו יום / למיון.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "7-9 episodes a day, or any incontinence, severe cramping."
      description: "7-9 יציאות ביום, או בריחת צואה, או התכווצויות חזקות.",
      matches: (f) =>
        (typeof f.stoolsPerDayOverBaseline === "number" &&
          f.stoolsPerDayOverBaseline >= 7) ||
        f.hasIncontinence === true ||
        f.hasSevereCramping === true,
      // EN: "This is severe and needs assessment in person today. Please call
      // your 24-hour oncology helpline now or go to your same-day emergency
      // care unit / A&E."
      action:
        "זהו מצב חמור המצריך הערכה פיזית היום. אנא התקשר/י עכשיו לקו החירום האונקולוגי הפעיל 24 שעות ביממה, או לך/י ליחידת הטיפול הדחוף באותו יום / למיון.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "4-6 episodes a day over your usual amount, any nocturnal bowel
      // movements, or moderate cramping."
      description:
        "4-6 יציאות ביום מעבר לכמות הרגילה שלך, יציאות בלילה, או התכווצויות בעוצמה בינונית.",
      matches: (f) =>
        typeof f.stoolsPerDayOverBaseline === "number" &&
        f.stoolsPerDayOverBaseline >= 4,
      // EN: "Please hold off any chemotherapy tablets you take at home until
      // your team has discussed this with you. Drink plenty of fluids, and
      // call your 24-hour helpline today to talk through your medication."
      action:
        "אנא המתן/י עם כדורי הכימותרפיה שאת/ה לוקח/ת בבית עד שהצוות המטפל ידבר איתך על כך. שתה/י הרבה נוזלים, והתקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לדבר על התרופות שלך.",
      escalateIf: [
        {
          condition: (f) => f.persistedDespiteMedication24h === true,
          escalateTo: "RED",
          // EN: "this hasn't improved in 24 hours despite anti-diarrhoeal medication"
          reason: "זה לא השתפר תוך 24 שעות למרות נטילת תרופה נגד שלשולים",
        },
        {
          condition: (f) => f.hasFeverOrOtherSymptoms === true,
          escalateTo: "RED",
          // EN: "you also have other symptoms alongside the diarrhoea"
          reason: "יש לך גם תסמינים נוספים יחד עם השלשול",
        },
      ],
    },
    {
      grade: "AMBER",
      // EN: "Grade 1 (Amber)"
      label: "דרגה 1 (כתום)",
      // EN: "Up to 3 bowel movements a day over your usual amount."
      description: "עד 3 יציאות ביום מעבר לכמות הרגילה שלך.",
      matches: (f) =>
        typeof f.stoolsPerDayOverBaseline === "number" &&
        f.stoolsPerDayOverBaseline >= 1,
      // EN: "Drink plenty of fluids and keep an eye on it. Call your 24-hour
      // helpline if it continues or gets worse over the next 24 hours."
      action:
        "שתה/י הרבה נוזלים ועקוב/י אחר המצב. התקשר/י לקו החירום הפעיל 24 שעות ביממה אם זה נמשך או מחמיר ב-24 השעות הקרובות.",
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
