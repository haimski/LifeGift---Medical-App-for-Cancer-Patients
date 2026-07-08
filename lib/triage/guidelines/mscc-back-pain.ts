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
 */
export const msccBackPainGuideline: ToxicityGuideline = {
  id: "mscc_back_pain",
  displayName: "Back pain (possible spinal cord compression)",
  aliases: ["back pain", "spine pain", "spinal pain"],
  boilerplateFooter: AO_TEAM_BOILERPLATE,
  screeningFields: [
    {
      id: "hasRedFlagBackPainFeatures",
      question:
        "Is the back pain band-like around your body, worse when lying flat, worse when coughing/sneezing/straining, keeping you awake at night, or different in character to any back pain you've had before?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasNumbnessTinglingOrWeakness",
      question:
        "Any new numbness, tingling, or weakness in your arms or legs, or unsteadiness on your feet (especially on stairs)?",
      type: "boolean",
      required: true,
    },
    {
      id: "hasBladderBowelOrSevereWeaknessChange",
      question:
        "Any new problems controlling your bladder or bowels, or significant weakness/paralysis in your legs?",
      type: "boolean",
      required: false,
    },
  ],
  grades: [
    {
      grade: "RED",
      label: "Grade 4 (Red)",
      description: "Paralysis, or new bladder/bowel disturbance — these are late, urgent signs.",
      matches: (f) => f.hasBladderBowelOrSevereWeaknessChange === true,
      action:
        "This needs emergency assessment right now — please call 999 or go to A&E immediately. These can be signs of the spinal cord being compressed, and delay risks permanent damage.",
    },
    {
      grade: "RED",
      label: "Grade 2-3 (Red)",
      description: "New numbness, tingling, weakness, or unsteadiness alongside back pain.",
      matches: (f) => f.hasNumbnessTinglingOrWeakness === true,
      action:
        "This combination needs urgent same-day assessment — please call your 24-hour helpline now or go to A&E. This needs an urgent scan to rule out pressure on the spinal cord.",
    },
    {
      grade: "AMBER",
      label: "Grade 1 (Amber)",
      description: "Back pain with features suggestive of spinal metastases, no neurological symptoms yet.",
      matches: (f) => f.hasRedFlagBackPainFeatures === true,
      action:
        "Please call your 24-hour helpline today — this pattern of back pain needs an MRI scan arranged, usually within a week, to rule out anything pressing on your spine. Please contact your helpline urgently if you notice any numbness, tingling, or weakness in the meantime.",
    },
    {
      grade: "GREEN",
      label: "None",
      description: "Ordinary back pain without red-flag features or neurological symptoms.",
      matches: (f) =>
        f.hasRedFlagBackPainFeatures === false && f.hasNumbnessTinglingOrWeakness === false,
      action:
        "This doesn't sound like it needs urgent spinal imaging, but do call your helpline if it changes character, keeps you awake at night, or you notice any numbness, tingling, or weakness.",
    },
  ],
};
