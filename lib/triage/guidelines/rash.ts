import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 13 (Skin
 * Rash). The source explicitly redirects immunotherapy patients to
 * Guideline 26 (immune-related skin toxicities), one of the excluded
 * irAE algorithms — so those patients are routed to the generic
 * excluded-condition fallback instead of the tiers below.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const rashGuideline: ToxicityGuideline = {
  id: "rash",
  // EN: "Skin rash"
  displayName: "פריחה בעור",
  // EN: ["rash", "skin eruption", "hives"]
  aliases: ["פריחה", "תפרחת", "סימני עור", "חרלת"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  alternatePathwayIf: {
    condition: (ctx) =>
      ctx.treatmentType === "immunotherapy" || ctx.treatmentType === "combination",
    useGuidelineId: "excluded_condition_fallback",
  },
  screeningFields: [
    {
      id: "rashCoveragePercent",
      // EN: "Roughly what percentage of your skin does the rash cover (a rough estimate is fine)?"
      question: "בערך איזה אחוז מהעור שלך מכוסה בפריחה (הערכה גסה מספיקה)?",
      type: "number",
      required: true,
    },
    {
      id: "affectsSleepOrDailyActivities",
      // EN: "Is it itchy enough, or sore enough, to affect your sleep or daily activities?"
      question: "האם זה מגרד או כואב מספיק כדי להשפיע על השינה או הפעילויות היומיומיות שלך?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasBlisteringOrUlceration",
      // EN: "Is there any blistering, peeling, or open/ulcerated skin?"
      question: "האם יש שלפוחיות, קילוף, או פצעים פתוחים בעור?",
      type: "boolean",
      required: false,
    },
    {
      id: "hasSpontaneousBleedingOrInfectionSigns",
      // EN: "Is there any spontaneous bleeding from the rash, or signs of infection (pus, spreading redness, fever)?"
      question: "האם יש דימום ספונטני מהפריחה, או סימני זיהום (מוגלה, אדמומיות מתפשטת, חום)?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Life-threatening: spontaneous bleeding or signs of infection."
      description: "מסכן חיים: דימום ספונטני או סימני זיהום.",
      matches: (f) => f.hasSpontaneousBleedingOrInfectionSigns === true,
      // EN: "This needs urgent assessment. Please go to A&E now or call your
      // 24-hour helpline immediately."
      action:
        "זה מצריך הערכה דחופה. אנא לך/י מיד למיון או התקשר/י מיד לקו החירום הפעיל 24 שעות ביממה.",
    },
    {
      grade: "RED",
      // EN: "Grade 3 (Red)"
      label: "דרגה 3 (אדום)",
      // EN: "More than 30% of skin surface, generalised/exfoliative/ulcerative, or blistering."
      description: "יותר מ-30% משטח העור, פריחה כללית/מקלפת/מכיבה, או שלפוחיות.",
      matches: (f) =>
        (typeof f.rashCoveragePercent === "number" && f.rashCoveragePercent >= 30) ||
        f.hasBlisteringOrUlceration === true,
      // EN: "This needs an urgent dermatology or oncology review today.
      // Please call your 24-hour helpline now."
      action:
        "זה מצריך בדיקה דחופה של רופא עור או אונקולוג היום. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "10-30% of skin surface, or itching/tightness affecting sleep or daily activities."
      description: "10-30% משטח העור, או גירוד/מתיחות המשפיעים על שינה או פעילויות יומיומיות.",
      matches: (f) =>
        (typeof f.rashCoveragePercent === "number" && f.rashCoveragePercent >= 10) ||
        f.affectsSleepOrDailyActivities === true,
      // EN: "Use a gentle emollient cream and an antihistamine if you have
      // one. Call your 24-hour helpline today so your team is aware."
      action:
        "השתמש/י בקרם לחות עדין ובאנטיהיסטמין אם יש לך. התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי שהצוות המטפל יידע.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "Less than 10% of skin surface, simple rash."
      description: "פחות מ-10% משטח העור, פריחה פשוטה.",
      matches: (f) =>
        typeof f.rashCoveragePercent === "number" && f.rashCoveragePercent < 10,
      // EN: "Keep the area moisturised and avoid irritants. Call your
      // helpline if it spreads, becomes itchy, or you feel unwell."
      action:
        "הקפד/י על לחות באזור והימנע/י מגורמים מגרים. התקשר/י לקו החירום אם זה מתפשט, נעשה מגרד, או שאת/ה מרגיש/ה לא טוב.",
    },
  ],
};
