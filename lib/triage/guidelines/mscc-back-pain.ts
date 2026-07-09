import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 9
 * (Metastatic Spinal Cord Compression / Cauda Equina Syndrome) —
 * simplified to the patient-observable red-flag questions from the
 * source ("Back pain" section: band-like pain, worse lying flat, worse
 * coughing/straining, disturbed sleep from night pain, gait disturbance)
 * plus the neurological deficit tiers. The source is emphatic that early
 * diagnosis matters because cord damage can be irreversible ("think
 * SPINE"), so this errs firmly toward Red once any neurological symptom
 * is reported — the full guideline's MRI-based confirmation and staging
 * happens after urgent referral, not in this chat.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const msccBackPainGuideline: ToxicityGuideline = {
  id: "mscc_back_pain",
  // EN: "Back pain (possible spinal cord compression)"
  displayName: "כאבי גב (חשד ללחץ על חוט השדרה)",
  // EN: ["back pain", "spine pain", "spinal pain"]
  aliases: ["כאב גב", "כאב בעמוד השדרה", "כאב שדרה"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "hasRedFlagBackPainFeatures",
      // EN: "Is the back pain band-like around your body, worse when lying
      // flat, worse when coughing/sneezing/straining, keeping you awake at
      // night, or different in character to any back pain you've had
      // before?"
      question:
        "האם כאב הגב מקיף כמו חגורה סביב הגוף, מחמיר כששוכבים ישר, מחמיר בשיעול/התעטשות/מאמץ, מונע ממך לישון בלילה, או שונה באופיו מכל כאב גב שהיה לך בעבר?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasNumbnessTinglingOrWeakness",
      // EN: "Any new numbness, tingling, or weakness in your arms or legs, or
      // unsteadiness on your feet (especially on stairs)?"
      question:
        "האם יש חוסר תחושה, עקצוצים, או חולשה חדשים בזרועות או ברגליים, או חוסר יציבות (במיוחד במדרגות)?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasBladderBowelOrSevereWeaknessChange",
      // EN: "Any new problems controlling your bladder or bowels, or
      // significant weakness/paralysis in your legs?"
      question:
        "האם יש בעיות חדשות בשליטה בשלפוחית השתן או במעיים, או חולשה משמעותית/שיתוק ברגליים?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Paralysis, or new bladder/bowel disturbance — these are late, urgent signs."
      description: "שיתוק, או הפרעה חדשה בשלפוחית השתן/במעיים — אלו סימנים מאוחרים ודחופים.",
      matches: (f) => f.hasBladderBowelOrSevereWeaknessChange === true,
      // EN: "This needs emergency assessment right now — please call 999 or
      // go to A&E immediately. These can be signs of the spinal cord being
      // compressed, and delay risks permanent damage."
      action:
        "זה מצריך הערכת חירום מיידית — אנא התקשר/י ל-999 או לך/י מיד למיון. אלו עשויים להיות סימנים ללחץ על חוט השדרה, ועיכוב מסכן בנזק בלתי הפיך.",
    },
    {
      grade: "RED",
      // EN: "Grade 2-3 (Red)"
      label: "דרגה 2-3 (אדום)",
      // EN: "New numbness, tingling, weakness, or unsteadiness alongside back pain."
      description: "חוסר תחושה, עקצוצים, חולשה, או חוסר יציבות חדשים יחד עם כאב גב.",
      matches: (f) => f.hasNumbnessTinglingOrWeakness === true,
      // EN: "This combination needs urgent same-day assessment — please call
      // your 24-hour helpline now or go to A&E. This needs an urgent scan to
      // rule out pressure on the spinal cord."
      action:
        "שילוב זה מצריך הערכה דחופה באותו יום — אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה או לך/י למיון. יש צורך בבדיקת הדמיה דחופה כדי לשלול לחץ על חוט השדרה.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 1 (Amber)"
      label: "דרגה 1 (כתום)",
      // EN: "Back pain with features suggestive of spinal metastases, no neurological symptoms yet."
      description: "כאב גב עם מאפיינים המרמזים על גרורות בעמוד השדרה, ללא תסמינים נוירולוגיים עדיין.",
      matches: (f) => f.hasRedFlagBackPainFeatures === true,
      // EN: "Please call your 24-hour helpline today — this pattern of back
      // pain needs an MRI scan arranged, usually within a week, to rule out
      // anything pressing on your spine. Please contact your helpline
      // urgently if you notice any numbness, tingling, or weakness in the
      // meantime."
      action:
        "אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה — תבנית כאב גב זו מצריכה תיאום בדיקת MRI, בדרך כלל תוך שבוע, כדי לשלול לחץ על עמוד השדרה. אנא פנה/י בדחיפות לקו החירום אם תבחין/י בחוסר תחושה, עקצוצים, או חולשה בינתיים.",
    },
    {
      grade: "GREEN",
      // EN: "None"
      label: "ללא",
      // EN: "Ordinary back pain without red-flag features or neurological symptoms."
      description: "כאב גב רגיל ללא מאפייני אזהרה או תסמינים נוירולוגיים.",
      matches: (f) =>
        f.hasRedFlagBackPainFeatures === false && f.hasNumbnessTinglingOrWeakness === false,
      // EN: "This doesn't sound like it needs urgent spinal imaging, but do
      // call your helpline if it changes character, keeps you awake at
      // night, or you notice any numbness, tingling, or weakness."
      action:
        "נשמע שזה לא מצריך הדמיה דחופה של עמוד השדרה, אך התקשר/י לקו החירום אם האופי משתנה, אם זה מונע ממך לישון בלילה, או שאת/ה מבחין/ה בחוסר תחושה, עקצוצים, או חולשה.",
    },
  ],
};
