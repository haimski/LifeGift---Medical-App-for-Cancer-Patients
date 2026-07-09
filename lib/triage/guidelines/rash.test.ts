import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const chemoCtx: PatientContext = {
  cancerType: "Colorectal",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

const immunotherapyCtx: PatientContext = { ...chemoCtx, treatmentType: "immunotherapy" };

describe("rash guideline", () => {
  it.each([
    [5, "GREEN"],
    [15, "AMBER"],
    [35, "RED"],
  ] as const)("%i%% body surface area grades as %s", (rashCoveragePercent, expectedGrade) => {
    const result = evaluate({ rashCoveragePercent }, chemoCtx, "rash");
    expect(result.grade).toBe(expectedGrade);
  });

  it("grades blistering/ulceration as Red even at low coverage", () => {
    const result = evaluate(
      { rashCoveragePercent: 5, hasBlisteringOrUlceration: true },
      chemoCtx,
      "rash"
    );
    expect(result.grade).toBe("RED");
  });

  it("grades spontaneous bleeding or infection signs as the most severe Red tier", () => {
    const result = evaluate(
      { rashCoveragePercent: 5, hasSpontaneousBleedingOrInfectionSigns: true },
      chemoCtx,
      "rash"
    );
    expect(result.grade).toBe("RED");
    expect(result.gradeLabel).toMatch(/דרגה 4/);
  });

  it("routes immunotherapy patients to the excluded-condition fallback", () => {
    const result = evaluate({ rashCoveragePercent: 5 }, immunotherapyCtx, "rash");
    expect(result.guidelineId).toBe("excluded_condition_fallback");
    expect(result.grade).toBe("AMBER");
  });
});
