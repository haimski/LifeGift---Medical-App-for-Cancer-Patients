import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Bowel",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("constipation guideline", () => {
  it.each([
    [12, "GREEN"],
    [47, "GREEN"],
    [48, "AMBER"],
    [71, "AMBER"],
    [72, "RED"],
    [95, "RED"],
    [96, "RED"],
  ] as const)("%i hours since last bowel movement grades as %s", (hours, expectedGrade) => {
    const result = evaluate({ hoursSinceBowelMovement: hours }, ctx, "constipation");
    expect(result.grade).toBe(expectedGrade);
  });

  it("escalates a 48-71h Amber to Red if there's abdominal pain or vomiting", () => {
    const result = evaluate(
      { hoursSinceBowelMovement: 50, hasAbdominalPainOrVomiting: true },
      ctx,
      "constipation"
    );
    expect(result.grade).toBe("RED");
  });

  it("grades obstruction symptoms as Red regardless of hours", () => {
    const result = evaluate(
      { hoursSinceBowelMovement: 10, hasObstructionSymptoms: true },
      ctx,
      "constipation"
    );
    expect(result.grade).toBe("RED");
  });
});
