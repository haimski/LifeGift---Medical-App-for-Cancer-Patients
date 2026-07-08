import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Myeloma",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("hypercalcaemia guideline", () => {
  it("grades no symptoms as Green", () => {
    const result = evaluate(
      { hasMildSymptoms: false, hasConfusionOrMoodChange: false },
      ctx,
      "hypercalcaemia"
    );
    expect(result.grade).toBe("GREEN");
  });

  it("grades mild symptoms (thirst/nausea/etc) as Amber", () => {
    const result = evaluate(
      { hasMildSymptoms: true, hasConfusionOrMoodChange: false },
      ctx,
      "hypercalcaemia"
    );
    expect(result.grade).toBe("AMBER");
  });

  it("grades confusion or mood change as Red", () => {
    const result = evaluate(
      { hasMildSymptoms: true, hasConfusionOrMoodChange: true },
      ctx,
      "hypercalcaemia"
    );
    expect(result.grade).toBe("RED");
  });

  it("grades seizures/collapse as the most severe Red tier", () => {
    const result = evaluate(
      { hasMildSymptoms: true, hasConfusionOrMoodChange: true, hasSeizuresOrCollapse: true },
      ctx,
      "hypercalcaemia"
    );
    expect(result.grade).toBe("RED");
    expect(result.gradeLabel).toMatch(/seizure/i);
  });
});
