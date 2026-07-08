import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Lung",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("vomiting guideline", () => {
  it.each([
    [0, "GREEN"],
    [2, "GREEN"],
    [3, "AMBER"],
    [5, "AMBER"],
    [6, "RED"],
    [10, "RED"],
    [11, "RED"],
  ] as const)("%i episodes in 24h grades as %s", (episodes, expectedGrade) => {
    const result = evaluate(
      { vomitingEpisodesLast24h: episodes },
      ctx,
      "vomiting"
    );
    expect(result.grade).toBe(expectedGrade);
  });

  it("distinguishes Grade 3 from Grade 4 within Red", () => {
    const grade3 = evaluate({ vomitingEpisodesLast24h: 7 }, ctx, "vomiting");
    const grade4 = evaluate({ vomitingEpisodesLast24h: 15 }, ctx, "vomiting");
    expect(grade3.gradeLabel).toBe("Grade 3 (Red)");
    expect(grade4.gradeLabel).toBe("Grade 4 (Red)");
  });
});
