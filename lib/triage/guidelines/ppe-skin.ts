import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 16 (Skin
 * Toxicity: Palmar-Plantar Erythrodysesthesia / hand-foot syndrome). The
 * source has no Red tier for this condition — Grade 3 is still Amber
 * ("stop the SACT until discussed with the team", not an emergency).
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const ppeSkinGuideline: ToxicityGuideline = {
  id: "ppe_skin",
  // EN: "Red/sore hands or feet (PPE)"
  displayName: "כפות ידיים או רגליים אדומות/כואבות (PPE)",
  // EN: ["hand foot syndrome", "sore palms", "sore soles", "palmar plantar"]
  aliases: ["תסמונת כף יד-כף רגל", "כפות ידיים כואבות", "כפות רגליים כואבות"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "ppeSeverity",
      // EN: "Are your hands/feet just numb, tingly, or slightly red without
      // pain, painful and limiting some activities, or painful and limiting
      // your ability to look after yourself (e.g. peeling, blistering,
      // cracking)?"
      question:
        "האם הידיים/הרגליים שלך רק קהות, עקצוצניות, או מעט אדומות ללא כאב, כואבות ומגבילות חלק מהפעילויות, או כואבות ומגבילות את היכולת שלך לטפל בעצמך (למשל קילוף, שלפוחיות, סדקים)?",
      type: "enum",
      enumOptions: [
        "none_or_painless",
        "painful_limiting_some_activities",
        "painful_limiting_self_care",
      ],
      required: true,
    },
  ],
  grades: [
    {
      grade: "AMBER",
      // EN: "Grade 3 (Amber)"
      label: "דרגה 3 (כתום)",
      // EN: "Severe skin changes (bleeding, peeling, blisters, fissures) with pain, limiting self-care."
      description:
        "שינויי עור חמורים (דימום, קילוף, שלפוחיות, סדקים) עם כאב, המגבילים טיפול עצמי.",
      matches: (f) => f.ppeSeverity === "painful_limiting_self_care",
      // EN: "Please stop the chemotherapy tablet causing this until your team
      // has discussed it with you, and call your 24-hour helpline today — a
      // high-urea cream and a dose review are usually needed."
      action:
        "אנא הפסק/י את כדור הכימותרפיה שגורם לכך עד שהצוות המטפל שלך ידבר איתך על כך, והתקשר/י היום לקו החירום הפעיל 24 שעות ביממה — בדרך כלל נדרשים קרם עם ריכוז אוריאה גבוה ובדיקה מחדש של המינון.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "Skin changes with pain, limiting some daily activities."
      description: "שינויי עור עם כאב, המגבילים חלק מהפעילויות היומיומיות.",
      matches: (f) => f.ppeSeverity === "painful_limiting_some_activities",
      // EN: "Please call your 24-hour helpline today to discuss whether your
      // chemotherapy tablet dose needs adjusting, and keep the skin
      // moisturised."
      action:
        "אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לדבר על האם יש צורך להתאים את מינון כדור הכימותרפיה שלך, והקפד/י על לחות בעור.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "Numbness, tingling, or painless redness/swelling."
      description: "קהות, עקצוצים, או אדמומיות/נפיחות ללא כאב.",
      matches: (f) => f.ppeSeverity === "none_or_painless",
      // EN: "Keep hands and feet moisturised, avoid tight shoes, and rest
      // them where you can. Call your helpline if it becomes painful."
      action:
        "הקפד/י על לחות בידיים וברגליים, הימנע/י מנעליים צמודות, ותן/י להן לנוח ככל שניתן. התקשר/י לקו החירום אם זה נעשה כואב.",
    },
  ],
};
