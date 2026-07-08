import { AO_TEAM_BOILERPLATE } from "@/lib/triage/boilerplate";
import type { ToxicityGuideline } from "@/lib/triage/types";

/**
 * UKONS Acute Oncology Initial Management Guidelines, Guideline 8
 * (Fatigue). Note Grade 3 is still Amber in the source (not Red) — only
 * "bedridden or disabling" (Grade 4) reaches Red.
 */
export const fatigueGuideline: ToxicityGuideline = {
  id: "fatigue",
  displayName: "Fatigue",
  aliases: ["exhausted", "no energy", "worn out"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "fatigueLevel",
      question:
        "Does resting help with the tiredness, and how much is it limiting what you can do — relieved by rest, limiting some daily tasks (like shopping/chores), limiting your ability to look after yourself, or are you bedridden?",
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
      label: "Grade 4 (Red)",
      description: "Bedridden or disabling.",
      matches: (f) => f.fatigueLevel === "bedridden",
      action:
        "This level of fatigue needs assessment today — please call your 24-hour helpline now, as blood counts or other causes may need checking urgently.",
    },
    {
      grade: "AMBER",
      label: "Grade 3 (Amber)",
      description: "Not relieved by rest, limiting self-care activities.",
      matches: (f) => f.fatigueLevel === "limits_selfcare_adl",
      action:
        "Please call your 24-hour helpline today so your team can check your blood counts and other possible causes.",
    },
    {
      grade: "AMBER",
      label: "Grade 2 (Amber)",
      description: "Not relieved by rest, limiting some daily activities.",
      matches: (f) => f.fatigueLevel === "limits_instrumental_adl",
      action:
        "Please mention this to your team at your next contact, and call your 24-hour helpline if it gets worse. Keep up your fluids and nutrition where you can.",
    },
    {
      grade: "GREEN",
      label: "Grade 1 (Green)",
      description: "Fatigue relieved by rest.",
      matches: (f) => f.fatigueLevel === "relieved_by_rest",
      action:
        "This is common during treatment. Rest when you need to, and pace gentle activity in between.",
    },
  ],
};
