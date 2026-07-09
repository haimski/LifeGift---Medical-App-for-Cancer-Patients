import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 35
 * (Hypercalcaemia of Malignancy). The source grades severity by corrected
 * serum calcium, which needs a blood test — not something a patient can
 * report. Per the app's scope decision, this is a simple symptom-based
 * floor (thirst/nausea/constipation/bone pain -> Amber; confusion/mood
 * change or seizures/collapse -> Red) that always directs to the
 * helpline for a blood test, rather than attempting to estimate the
 * calcium level itself.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const hypercalcaemiaGuideline: ToxicityGuideline = {
  id: "hypercalcaemia",
  // EN: "Possible hypercalcaemia"
  displayName: "חשד לרמת סידן גבוהה בדם (היפרקלצמיה)",
  // EN: ["high calcium", "very thirsty", "excessive thirst"]
  aliases: ["סידן גבוה", "צמא מאוד", "צמאון מוגזם"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "hasMildSymptoms",
      // EN: "Have you been unusually thirsty or passing a lot of urine, or do
      // you have nausea, constipation, bone pain, or fatigue?"
      question:
        "האם היית צמא/ה באופן חריג או הטלת שתן בכמות גדולה, או שיש לך בחילה, עצירות, כאבי עצמות, או עייפות?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasConfusionOrMoodChange",
      // EN: "Any new confusion, drowsiness, or mood/behaviour changes?"
      question: "האם יש בלבול, ישנוניות, או שינויים במצב הרוח/בהתנהגות שהם חדשים?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasSeizuresOrCollapse",
      // EN: "Any seizures, fainting, or collapse?"
      question: "האם היו התקפים, התעלפות, או קריסה?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Severe — possible seizure/collapse"
      label: "חמור — אפשרות להתקף/קריסה",
      // EN: "Seizures, collapse, or loss of consciousness."
      description: "התקפים, קריסה, או אובדן הכרה.",
      matches: (f) => f.hasSeizuresOrCollapse === true,
      // EN: "This is a medical emergency. Call 999 or go to A&E now."
      action: "זהו מצב חירום רפואי. התקשר/י ל-999 או לך/י מיד למיון.",
    },
    {
      grade: "RED",
      // EN: "Confusion or mood change"
      label: "בלבול או שינוי במצב הרוח",
      // EN: "New confusion, drowsiness, or mood/behaviour changes."
      description: "בלבול, ישנוניות, או שינויים במצב הרוח/בהתנהגות שהם חדשים.",
      matches: (f) => f.hasConfusionOrMoodChange === true,
      // EN: "This needs an urgent blood test today to check your calcium
      // level. Please call your 24-hour helpline now or go to A&E if you're
      // very drowsy or confused."
      action:
        "זה מצריך בדיקת דם דחופה היום כדי לבדוק את רמת הסידן שלך. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה, או לך/י למיון אם את/ה ישנוני/ת או מבולבל/ת מאוד.",
    },
    {
      grade: "AMBER",
      // EN: "Mild symptoms"
      label: "תסמינים קלים",
      // EN: "Excessive thirst, nausea, constipation, bone pain, or fatigue."
      description: "צמאון מוגזם, בחילה, עצירות, כאבי עצמות, או עייפות.",
      matches: (f) => f.hasMildSymptoms === true,
      // EN: "These can be symptoms of a high calcium level, which is checked
      // with a simple blood test. Please call your 24-hour helpline today to
      // arrange one."
      action:
        "אלו יכולים להיות תסמינים של רמת סידן גבוהה, שנבדקת בבדיקת דם פשוטה. אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לתאם אחת.",
    },
    {
      grade: "GREEN",
      // EN: "None"
      label: "ללא",
      // EN: "None of the above symptoms."
      description: "אף אחד מהתסמינים הנ\"ל.",
      matches: (f) =>
        f.hasMildSymptoms === false && f.hasConfusionOrMoodChange === false,
      // EN: "No specific action needed right now."
      action: "אין צורך בפעולה מיוחדת כרגע.",
    },
  ],
};
