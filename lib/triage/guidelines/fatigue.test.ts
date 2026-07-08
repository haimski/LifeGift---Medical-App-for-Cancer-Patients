import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Ovarian",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("fatigue guideline", () => {
  it.each([
    ["relieved_by_rest", "GREEN"],
    ["limits_instrumental_adl", "AMBER"],
    ["limits_selfcare_adl", "AMBER"],
    ["bedridden", "RED"],
  ] as const)("level '%s' grades as %s", (fatigueLevel, expectedGrade) => {
    const result = evaluate({ fatigueLevel }, ctx, "fatigue");
    expect(result.grade).toBe(expectedGrade);
  });
});
