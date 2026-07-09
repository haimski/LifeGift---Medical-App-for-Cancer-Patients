import type { GlobalOverrideRule, ScreeningField } from "@/lib/triage/types";

/**
 * These three fields aren't owned by any single guideline — the override
 * above needs them checked on every turn regardless of what symptom the
 * patient is describing. The LLM extraction step (lib/llm/extraction.ts)
 * always attempts to populate them, in addition to whichever guideline's
 * own screening fields are active.
 *
 * Questions translated to Hebrew — original English preserved per field
 * below for clinician review against the source PDF.
 */
export const GLOBAL_OVERRIDE_SCREENING_FIELDS: ScreeningField[] = [
  {
    id: "temperatureC",
    // EN: "What's your temperature (in Celsius), if you've taken it?"
    question: "מהי הטמפרטורה שלך (במעלות צלזיוס), אם מדדת?",
    type: "number",
    required: false,
  },
  {
    id: "feelsGenerallyUnwell",
    // EN: "Would you say you're feeling generally unwell?"
    question: "האם היית אומר/ת שאתה מרגיש/ה לא טוב באופן כללי?",
    type: "boolean",
    required: false,
  },
  {
    id: "hasRigorsOrShivering",
    // EN: "Have you had any shivering or rigors (shaking chills)?"
    question: "האם היו לך רעידות או צמרמורות (חום עם רעד)?",
    type: "boolean",
    required: false,
  },
];

/**
 * UKONS 24-Hour Triage Tool, "Fever" row + Acute Oncology Initial
 * Management Guidelines, Guideline 12 (Suspected Neutropenic Sepsis).
 *
 * This is the single highest-priority rule in the whole source document.
 * It is evaluated first, on every turn, regardless of which symptom the
 * patient is describing — sepsis can hide behind any presenting
 * complaint, and the guidelines are explicit that it must never be missed
 * because attention is on a different symptom. See engine.ts's evaluation
 * order: if this rule fires, nothing else runs.
 *
 * "If temperature is 37.5C or above or below 36C or generally unwell -
 * Contact telephone helpline for URGENT Assessment - Risk of neutropenic
 * sepsis. ALERT - Patients on steroids/analgesics or dehydrated may not
 * present with pyrexia but may still have infection."
 *
 * displayName/action translated to Hebrew — original English preserved
 * below for clinician review against the source PDF.
 */
export const neutropenicSepsisOverride: GlobalOverrideRule = {
  id: "neutropenic_sepsis_override",
  // EN: "Suspected Neutropenic Sepsis"
  displayName: "חשד לספסיס נויטרופני (Neutropenic Sepsis)",
  grade: "RED",
  // EN: "Temperature 37.5C or above, or below 36C, or generally unwell/
  // rigors, within 6 weeks of cancer treatment."
  description:
    "טמפרטורה 37.5 מעלות צלזיוס ומעלה, או מתחת ל-36 מעלות, או תחושת חולי כללית/רעידות, בתוך שישה שבועות מטיפול בסרטן.",
  appliesIf: (fields, ctx) => {
    if (!ctx.recentSactWithin6Weeks) return false;

    const temperatureC =
      typeof fields.temperatureC === "number" ? fields.temperatureC : null;
    const temperatureAbnormal =
      temperatureC !== null && (temperatureC >= 37.5 || temperatureC < 36);

    return (
      temperatureAbnormal ||
      fields.feelsGenerallyUnwell === true ||
      fields.hasRigorsOrShivering === true
    );
  },
  // EN: "Because you've had cancer treatment in the last 6 weeks and have
  // these symptoms, this could be neutropenic sepsis, which is a medical
  // emergency. Go to A&E now or call your 24-hour oncology helpline
  // immediately — do not wait to see if it improves. Antibiotics usually
  // need to start within 1 hour, so please don't delay."
  action:
    "מכיוון שעברת טיפול בסרטן בשישה השבועות האחרונים ויש לך תסמינים אלו, ייתכן שמדובר בספסיס נויטרופני, שהוא מצב חירום רפואי. " +
    "לך/י מיד למיון או התקשר/י מיד לקו החירום האונקולוגי הפעיל 24 שעות ביממה — אין להמתין כדי לראות אם המצב משתפר. " +
    "בדרך כלל יש להתחיל אנטיביוטיקה תוך שעה אחת, לכן נא לא להשתהות.",
};
