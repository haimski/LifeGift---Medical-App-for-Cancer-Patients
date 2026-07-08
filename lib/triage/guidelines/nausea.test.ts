import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Stomach",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("nausea guideline", () => {
  it.each([
    ["eating_drinking_normally", "GREEN"],
    ["decreased_intake", "AMBER"],
    ["no_intake", "RED"],
  ] as const)("intake level '%s' grades as %s", (nauseaIntakeLevel, expectedGrade) => {
    const result = evaluate({ nauseaIntakeLevel }, ctx, "nausea");
    expect(result.grade).toBe(expectedGrade);
  });
});
