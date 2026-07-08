import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const chemoCtx: PatientContext = {
  cancerType: "Breast",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

const immunotherapyCtx: PatientContext = { ...chemoCtx, treatmentType: "immunotherapy" };

describe("arthralgia/myalgia guideline", () => {
  it.each([
    ["none_or_mild", "GREEN"],
    ["moderate", "AMBER"],
    ["severe", "RED"],
    ["bedridden", "RED"],
  ] as const)("interference level '%s' grades as %s", (painInterferenceLevel, expectedGrade) => {
    const result = evaluate({ painInterferenceLevel }, chemoCtx, "arthralgia_myalgia");
    expect(result.grade).toBe(expectedGrade);
  });

  it("routes immunotherapy patients to the excluded-condition fallback", () => {
    const result = evaluate(
      { painInterferenceLevel: "moderate" },
      immunotherapyCtx,
      "arthralgia_myalgia"
    );
    expect(result.guidelineId).toBe("excluded_condition_fallback");
  });
});
