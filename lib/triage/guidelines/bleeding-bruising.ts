import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 3
 * (Bleeding and/or Bruising). The source grades bleeding by units of
 * blood lost (1-2 / 3-4 / >4 units), which a patient can't self-report —
 * this maps that to patient-observable severity language instead
 * (controlled vs. ongoing vs. won't stop) and treats it, and any spread
 * of bruising beyond a localised area, as at least Red, in keeping with
 * the source's low threshold for concern in myelosuppressed patients.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const bleedingBruisingGuideline: ToxicityGuideline = {
  id: "bleeding_bruising",
  // EN: "Bleeding / bruising"
  displayName: "דימום / חבורות",
  // EN: ["bleeding", "bruising", "bruises", "won't stop bleeding"]
  aliases: ["דימום", "חבורות", "לא מפסיק לדמם"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "bleedingSeverity",
      // EN: "Are you bleeding from anywhere right now? Would you say: no
      // bleeding, a small amount that's stopped or stops with pressure, a
      // significant amount that's ongoing, or severe bleeding that won't
      // stop?"
      question:
        "האם את/ה מדמם/ת כרגע מאיזשהו מקום? היית אומר/ת: אין דימום, כמות קטנה שנפסקה או נעצרת בלחיצה, כמות משמעותית שממשיכה, או דימום חמור שלא נפסק?",
      type: "enum",
      enumOptions: ["none", "minor_controlled", "significant", "severe_uncontrolled"],
      required: true,
    },
    {
      id: "bruisingSpread",
      // EN: "Do you have any new bruising — none, a few small bruises in one
      // area, or bruising that's widespread or appeared without any injury?"
      question:
        "האם יש לך חבורות חדשות — אין, כמה חבורות קטנות באזור אחד, או חבורות נרחבות או כאלה שהופיעו ללא כל פגיעה?",
      type: "enum",
      enumOptions: ["none", "localised", "widespread_or_spontaneous"],
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Life-threatening haemorrhage / severe bleeding that won't stop."
      description: "דימום מסכן חיים / דימום חמור שלא נפסק.",
      matches: (f) => f.bleedingSeverity === "severe_uncontrolled",
      // EN: "This sounds like it could be a life-threatening bleed. Call 999
      // or go to A&E now."
      action:
        "נשמע שמדובר בדימום שעלול לסכן חיים. התקשר/י ל-999 או לך/י מיד למיון.",
    },
    {
      grade: "RED",
      // EN: "Grade 2-3 (Red)"
      label: "דרגה 2-3 (אדום)",
      // EN: "Ongoing significant bleeding, or widespread/spontaneous bruising."
      description: "דימום משמעותי מתמשך, או חבורות נרחבות/ספונטניות.",
      matches: (f) =>
        f.bleedingSeverity === "significant" ||
        f.bruisingSpread === "widespread_or_spontaneous",
      // EN: "This needs urgent same-day assessment — it could be related to
      // your platelet count. Please call your 24-hour helpline now or go to
      // A&E."
      action:
        "זה מצריך הערכה דחופה באותו יום — ייתכן שקשור לספירת הטסיות שלך. אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה או לך/י למיון.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 1 (Amber)"
      label: "דרגה 1 (כתום)",
      // EN: "Minor bleeding controlled by pressure, or localised bruising."
      description: "דימום קל שנשלט בלחיצה, או חבורות מקומיות.",
      matches: (f) =>
        f.bleedingSeverity === "minor_controlled" || f.bruisingSpread === "localised",
      // EN: "Keep an eye on it and apply gentle pressure if it's still
      // bleeding. Call your 24-hour helpline today to mention it, especially
      // if you're on any blood thinners."
      action:
        "עקוב/י אחר המצב והפעל/י לחץ עדין אם עדיין יש דימום. התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי לדווח על כך, במיוחד אם את/ה נוטל/ת מדללי דם.",
    },
    {
      grade: "GREEN",
      // EN: "None"
      label: "ללא",
      // EN: "No bleeding and no new bruising."
      description: "אין דימום ואין חבורות חדשות.",
      // Worst-first evaluation means the Red/Amber bruising criteria above
      // are always checked first, so reaching this criterion already
      // implies bruisingSpread was "none" (or unreported).
      matches: (f) => f.bleedingSeverity === "none",
      // EN: "No specific action needed right now."
      action: "אין צורך בפעולה מיוחדת כרגע.",
    },
  ],
};
