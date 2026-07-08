import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Breast",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("extravasation guideline", () => {
  it("grades any suspected extravasation as an immediate Amber alert", () => {
    const result = evaluate({}, ctx, "extravasation");
    expect(result.grade).toBe("AMBER");
    expect(result.actionText).toMatch(/stop it now/i);
  });
});
