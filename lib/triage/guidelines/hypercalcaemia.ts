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
 */
export const hypercalcaemiaGuideline: ToxicityGuideline = {
  id: "hypercalcaemia",
  displayName: "Possible hypercalcaemia",
  aliases: ["high calcium", "very thirsty", "excessive thirst"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "hasMildSymptoms",
      question:
        "Have you been unusually thirsty or passing a lot of urine, or do you have nausea, constipation, bone pain, or fatigue?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasConfusionOrMoodChange",
      question: "Any new confusion, drowsiness, or mood/behaviour changes?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasSeizuresOrCollapse",
      question: "Any seizures, fainting, or collapse?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Severe — possible seizure/collapse",
      description: "Seizures, collapse, or loss of consciousness.",
      matches: (f) => f.hasSeizuresOrCollapse === true,
      action: "This is a medical emergency. Call 999 or go to A&E now.",
    },
    {
      grade: "RED",
      label: "Confusion or mood change",
      description: "New confusion, drowsiness, or mood/behaviour changes.",
      matches: (f) => f.hasConfusionOrMoodChange === true,
      action:
        "This needs an urgent blood test today to check your calcium level. Please call your 24-hour helpline now or go to A&E if you're very drowsy or confused.",
    },
    {
      grade: "AMBER",
      label: "Mild symptoms",
      description: "Excessive thirst, nausea, constipation, bone pain, or fatigue.",
      matches: (f) => f.hasMildSymptoms === true,
      action:
        "These can be symptoms of a high calcium level, which is checked with a simple blood test. Please call your 24-hour helpline today to arrange one.",
    },
    {
      grade: "GREEN",
      label: "None",
      description: "None of the above symptoms.",
      matches: (f) =>
        f.hasMildSymptoms === false && f.hasConfusionOrMoodChange === false,
      action: "No specific action needed right now.",
    },
  ],
};
