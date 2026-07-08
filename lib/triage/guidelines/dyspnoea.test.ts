import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const chemoCtx: PatientContext = {
  cancerType: "Lung",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

const immunotherapyCtx: PatientContext = { ...chemoCtx, treatmentType: "immunotherapy" };

describe("dyspnoea guideline", () => {
  it.each([
    ["none", "GREEN"],
    ["moderate_exertion", "AMBER"],
    ["minimal_exertion", "RED"],
    ["at_rest", "RED"],
    ["life_threatening", "RED"],
  ] as const)("severity '%s' grades as %s", (severity, expectedGrade) => {
    const result = evaluate({ dyspnoeaSeverity: severity }, chemoCtx, "dyspnoea");
    expect(result.grade).toBe(expectedGrade);
  });

  it("routes immunotherapy patients to the excluded-condition fallback instead of grading directly", () => {
    const result = evaluate(
      { dyspnoeaSeverity: "moderate_exertion" },
      immunotherapyCtx,
      "dyspnoea"
    );
    expect(result.guidelineId).toBe("excluded_condition_fallback");
    expect(result.grade).toBe("AMBER");
  });
});
