import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const ctx: PatientContext = {
  cancerType: "Leukaemia",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

describe("bleeding/bruising guideline", () => {
  it("grades no bleeding/bruising as Green", () => {
    const result = evaluate(
      { bleedingSeverity: "none", bruisingSpread: "none" },
      ctx,
      "bleeding_bruising"
    );
    expect(result.grade).toBe("GREEN");
  });

  it("grades minor controlled bleeding as Amber", () => {
    const result = evaluate({ bleedingSeverity: "minor_controlled" }, ctx, "bleeding_bruising");
    expect(result.grade).toBe("AMBER");
  });

  it("grades localised bruising alone as Amber", () => {
    const result = evaluate(
      { bleedingSeverity: "none", bruisingSpread: "localised" },
      ctx,
      "bleeding_bruising"
    );
    expect(result.grade).toBe("AMBER");
  });

  it("grades significant ongoing bleeding as Red", () => {
    const result = evaluate({ bleedingSeverity: "significant" }, ctx, "bleeding_bruising");
    expect(result.grade).toBe("RED");
  });

  it("grades widespread/spontaneous bruising as Red even with no active bleeding", () => {
    const result = evaluate(
      { bleedingSeverity: "none", bruisingSpread: "widespread_or_spontaneous" },
      ctx,
      "bleeding_bruising"
    );
    expect(result.grade).toBe("RED");
  });

  it("grades severe uncontrolled bleeding as Red (life-threatening tier)", () => {
    const result = evaluate({ bleedingSeverity: "severe_uncontrolled" }, ctx, "bleeding_bruising");
    expect(result.grade).toBe("RED");
    expect(result.gradeLabel).toMatch(/דרגה 4/);
  });
});
