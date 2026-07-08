import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Head and neck",
  treatmentType: "radiotherapy",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("mucositis guideline", () => {
  it.each([
    ["painless_eating_normally", "GREEN"],
    ["painful_eating_ok", "AMBER"],
    ["painful_difficulty_eating", "RED"],
    ["severe_minimal_intake", "RED"],
  ] as const)("severity '%s' grades as %s", (mouthSeverity, expectedGrade) => {
    const result = evaluate({ mouthSeverity }, ctx, "mucositis");
    expect(result.grade).toBe(expectedGrade);
  });
});
