import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Breast",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: true,
};

describe("engine: global override precedence", () => {
  it("fires Red via the neutropenic sepsis override even when the active guideline's own fields would only justify Amber", () => {
    // stoolsPerDayOverBaseline: 2 alone would grade Amber (Grade 1) under the
    // diarrhoea guideline — this proves the override actually cuts across
    // whatever symptom is being evaluated, not just that it exists in isolation.
    const result = evaluate(
      {
        stoolsPerDayOverBaseline: 2,
        hasBloodInStool: false,
        temperatureC: 38,
      },
      ctx,
      "diarrhoea"
    );

    expect(result.grade).toBe("RED");
    expect(result.source).toBe("global_override");
    expect(result.guidelineId).toBe("neutropenic_sepsis_override");
    // The staff dashboard's drill-down (Phase 8) quotes this verbatim as
    // "why this grade" — it must always be populated, not just actionText.
    expect(result.description.length).toBeGreaterThan(0);
  });

  it("does not fire the override for a patient with no recent SACT, even with a fever", () => {
    const noRecentTreatment: PatientContext = {
      ...ctx,
      recentSactWithin6Weeks: false,
    };
    const result = evaluate(
      { stoolsPerDayOverBaseline: 2, hasBloodInStool: false, temperatureC: 38 },
      noRecentTreatment,
      "diarrhoea"
    );

    expect(result.source).not.toBe("global_override");
    expect(result.grade).toBe("AMBER");
  });
});

describe("engine: fail-safe behaviour", () => {
  it("defaults to Amber, never Green, when no guideline is matched", () => {
    const result = evaluate({}, ctx, null);
    expect(result.grade).toBe("AMBER");
    expect(result.source).toBe("fail_safe");
    expect(result.description.length).toBeGreaterThan(0);
  });

  it("defaults to Amber when possibleExcludedCondition is flagged, even with a known guideline id", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 0, hasBloodInStool: false },
      ctx,
      "diarrhoea",
      { possibleExcludedCondition: true }
    );
    expect(result.grade).toBe("AMBER");
    expect(result.source).toBe("fail_safe");
  });

  it("defaults to Amber when fields don't cleanly match any grade band", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: null, hasBloodInStool: false },
      ctx,
      "diarrhoea"
    );
    expect(result.grade).toBe("AMBER");
    expect(result.source).toBe("fail_safe");
  });
});
