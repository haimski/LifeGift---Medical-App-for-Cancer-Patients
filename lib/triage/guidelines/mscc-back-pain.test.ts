import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Prostate",
  treatmentType: "not_on_active_treatment",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("MSCC / back pain red-flag guideline", () => {
  it("grades ordinary back pain with no red flags as Green", () => {
    const result = evaluate(
      { hasRedFlagBackPainFeatures: false, hasNumbnessTinglingOrWeakness: false },
      ctx,
      "mscc_back_pain"
    );
    expect(result.grade).toBe("GREEN");
  });

  it("grades red-flag back pain features alone as Amber", () => {
    const result = evaluate(
      { hasRedFlagBackPainFeatures: true, hasNumbnessTinglingOrWeakness: false },
      ctx,
      "mscc_back_pain"
    );
    expect(result.grade).toBe("AMBER");
  });

  it("grades any numbness/tingling/weakness as Red", () => {
    const result = evaluate(
      { hasRedFlagBackPainFeatures: true, hasNumbnessTinglingOrWeakness: true },
      ctx,
      "mscc_back_pain"
    );
    expect(result.grade).toBe("RED");
  });

  it("grades bladder/bowel/severe weakness change as the most severe Red tier", () => {
    const result = evaluate(
      {
        hasRedFlagBackPainFeatures: true,
        hasNumbnessTinglingOrWeakness: true,
        hasBladderBowelOrSevereWeaknessChange: true,
      },
      ctx,
      "mscc_back_pain"
    );
    expect(result.grade).toBe("RED");
    expect(result.gradeLabel).toMatch(/Grade 4/);
  });
});
