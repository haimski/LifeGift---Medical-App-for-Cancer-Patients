import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Lung",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("chest pain guideline", () => {
  it("grades any reported chest pain as Red, with no lower tier", () => {
    const result = evaluate({}, ctx, "chest_pain");
    expect(result.grade).toBe("RED");
    expect(result.source).toBe("guideline");
  });
});
