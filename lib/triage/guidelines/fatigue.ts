import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 8
 * (Fatigue). Note Grade 3 is still Amber in the source (not Red) — only
 * "bedridden or disabling" (Grade 4) reaches Red.
 *
 * Patient-facing strings translated to Hebrew — original English
 * preserved per field below for clinician review against the source PDF.
 */
export const fatigueGuideline: ToxicityGuideline = {
  id: "fatigue",
  // EN: "Fatigue"
  displayName: "עייפות",
  // EN: ["exhausted", "no energy", "worn out"]
  aliases: ["תשוש", "אין לי אנרגיה", "מותש"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "fatigueLevel",
      // EN: "Does resting help with the tiredness, and how much is it
      // limiting what you can do — relieved by rest, limiting some daily
      // tasks (like shopping/chores), limiting your ability to look after
      // yourself, or are you bedridden?"
      question:
        "האם מנוחה עוזרת לעייפות, ועד כמה היא מגבילה את מה שאת/ה מסוגל/ת לעשות — משתפרת עם מנוחה, מגבילה חלק מהמטלות היומיומיות (כמו קניות/מטלות בית), מגבילה את היכולת שלך לטפל בעצמך, או שאת/ה מרותק/ת למיטה?",
      type: "enum",
      enumOptions: [
        "relieved_by_rest",
        "limits_instrumental_adl",
        "limits_selfcare_adl",
        "bedridden",
      ],
      required: true,
    },
  ],
  grades: [
    {
      grade: "RED",
      // EN: "Grade 4 (Red)"
      label: "דרגה 4 (אדום)",
      // EN: "Bedridden or disabling."
      description: "מרותק/ת למיטה או עייפות משביתה.",
      matches: (f) => f.fatigueLevel === "bedridden",
      // EN: "This level of fatigue needs assessment today — please call your
      // 24-hour helpline now, as blood counts or other causes may need
      // checking urgently."
      action:
        "רמת עייפות זו מצריכה הערכה היום — אנא התקשר/י עכשיו לקו החירום הפעיל 24 שעות ביממה, מכיוון שייתכן שיש צורך לבדוק בדחיפות ספירת דם או גורמים אחרים.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 3 (Amber)"
      label: "דרגה 3 (כתום)",
      // EN: "Not relieved by rest, limiting self-care activities."
      description: "לא משתפרת עם מנוחה, מגבילה פעילויות טיפול עצמי.",
      matches: (f) => f.fatigueLevel === "limits_selfcare_adl",
      // EN: "Please call your 24-hour helpline today so your team can check
      // your blood counts and other possible causes."
      action:
        "אנא התקשר/י היום לקו החירום הפעיל 24 שעות ביממה כדי שהצוות המטפל שלך יוכל לבדוק את ספירת הדם וגורמים אפשריים נוספים.",
    },
    {
      grade: "AMBER",
      // EN: "Grade 2 (Amber)"
      label: "דרגה 2 (כתום)",
      // EN: "Not relieved by rest, limiting some daily activities."
      description: "לא משתפרת עם מנוחה, מגבילה חלק מהפעילויות היומיומיות.",
      matches: (f) => f.fatigueLevel === "limits_instrumental_adl",
      // EN: "Please mention this to your team at your next contact, and call
      // your 24-hour helpline if it gets worse. Keep up your fluids and
      // nutrition where you can."
      action:
        "אנא ציין/י זאת בפני הצוות המטפל בפעם הבאה שתהיה בקשר, והתקשר/י לקו החירום הפעיל 24 שעות ביממה אם המצב מחמיר. הקפד/י על נוזלים ותזונה ככל שניתן.",
    },
    {
      grade: "GREEN",
      // EN: "Grade 1 (Green)"
      label: "דרגה 1 (ירוק)",
      // EN: "Fatigue relieved by rest."
      description: "עייפות שמשתפרת עם מנוחה.",
      matches: (f) => f.fatigueLevel === "relieved_by_rest",
      // EN: "This is common during treatment. Rest when you need to, and pace
      // gentle activity in between."
      action:
        "זה נפוץ במהלך הטיפול. נוח/י כשצריך, ופזר/י פעילות קלה ביניים.",
    },
  ],
};
