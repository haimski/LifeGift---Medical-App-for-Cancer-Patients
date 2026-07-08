import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Colorectal",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("PPE / hand-foot skin toxicity guideline", () => {
  it.each([
    ["none_or_painless", "GREEN"],
    ["painful_limiting_some_activities", "AMBER"],
    ["painful_limiting_self_care", "AMBER"],
  ] as const)("severity '%s' grades as %s (no Red tier in the source)", (ppeSeverity, expectedGrade) => {
    const result = evaluate({ ppeSeverity }, ctx, "ppe_skin");
    expect(result.grade).toBe(expectedGrade);
  });
});
