import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * Redirect target for guidelines whose immunotherapy-specific variant is a
 * lab-value-driven immune-related-adverse-event algorithm (guidelines
 * 18-28 in the source PDF — adrenal/thyroid/hepatic/neuro/skin irAEs
 * etc.), which this app deliberately does not attempt to grade — see
 * README's scope-boundary section. Always floors at Amber and points the
 * patient at their oncology team rather than fabricating a specific
 * pathway. Never defaults to Green.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const excludedConditionFallbackGuideline: ToxicityGuideline = {
  id: "excluded_condition_fallback",
  // EN: "Needs clinical assessment"
  displayName: "דורש הערכה קלינית",
  aliases: [],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [],
  grades: [
    {
      grade: "AMBER",
      // EN: "Needs oncology team input"
      label: "דורש התייחסות של הצוות האונקולוגי",
      // EN: "Symptom pattern that, on immunotherapy, needs blood tests or an in-person assessment this chat can't do."
      description:
        "תבנית תסמינים אשר, במהלך טיפול באימונותרפיה, מצריכה בדיקות דם או הערכה פיזית שהצ'אט הזה אינו יכול לספק.",
      matches: () => true,
      // EN: "Because of the combination of your treatment and this symptom,
      // this needs your oncology team to assess it directly — it may need
      // blood tests. Please call your 24-hour helpline today to talk it
      // through."
      action:
        "בשל השילוב בין הטיפול שלך לבין התסמין הזה, יש צורך שהצוות האונקולוגי שלך יעריך זאת ישירות — ייתכן שיידרשו בדיקות דם. אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לדבר על כך.",
    },
  ],
};
