import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Melanoma",
  treatmentType: "immunotherapy",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: true,
};

describe("excluded-condition fallback guideline", () => {
  it("always grades Amber and never Green", () => {
    const result = evaluate({}, ctx, "excluded_condition_fallback");
    expect(result.grade).toBe("AMBER");
  });

  it("is reached via possibleExcludedCondition even for a matched, in-scope guideline", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 0, hasBloodInStool: false },
      { ...ctx, treatmentType: "chemotherapy_sact", recentSactWithin6Weeks: false },
      "diarrhoea",
      { possibleExcludedCondition: true }
    );
    expect(result.grade).toBe("AMBER");
    expect(result.source).toBe("fail_safe");
  });
});
