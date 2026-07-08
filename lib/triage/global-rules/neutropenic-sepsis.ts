import type { GlobalOverrideRule } from "@/lib/triage/types";

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
 */
export const neutropenicSepsisOverride: GlobalOverrideRule = {
  id: "neutropenic_sepsis_override",
  displayName: "Suspected Neutropenic Sepsis",
  grade: "RED",
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
  action:
    "Because you've had cancer treatment in the last 6 weeks and have these symptoms, this could be neutropenic sepsis, which is a medical emergency. " +
    "Go to A&E now or call your 24-hour oncology helpline immediately — do not wait to see if it improves. " +
    "Antibiotics usually need to start within 1 hour, so please don't delay.",
};
