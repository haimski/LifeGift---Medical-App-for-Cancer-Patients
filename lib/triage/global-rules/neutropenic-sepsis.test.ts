import { describe, expect, it } from "vitest";
import { neutropenicSepsisOverride } from "@/lib/triage/global-rules/neutropenic-sepsis";
import type { PatientContext } from "@/lib/triage/types";

const baseCtx: PatientContext = {
  cancerType: "Breast",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: true,
};

describe("neutropenicSepsisOverride", () => {
  it("does not fire without recent SACT, even with a high temperature", () => {
    const ctx = { ...baseCtx, recentSactWithin6Weeks: false };
    expect(
      neutropenicSepsisOverride.appliesIf({ temperatureC: 39 }, ctx)
    ).toBe(false);
  });

  it("fires on a high temperature with recent SACT", () => {
    expect(
      neutropenicSepsisOverride.appliesIf({ temperatureC: 38 }, baseCtx)
    ).toBe(true);
  });

  it("fires on a low temperature with recent SACT", () => {
    expect(
      neutropenicSepsisOverride.appliesIf({ temperatureC: 35.5 }, baseCtx)
    ).toBe(true);
  });

  it("does not fire on a normal temperature with no other symptoms", () => {
    expect(
      neutropenicSepsisOverride.appliesIf({ temperatureC: 37 }, baseCtx)
    ).toBe(false);
  });

  it("fires on 'generally unwell' alone, without a temperature reading", () => {
    expect(
      neutropenicSepsisOverride.appliesIf(
        { temperatureC: null, feelsGenerallyUnwell: true },
        baseCtx
      )
    ).toBe(true);
  });

  it("fires on rigors/shivering alone", () => {
    expect(
      neutropenicSepsisOverride.appliesIf(
        { hasRigorsOrShivering: true },
        baseCtx
      )
    ).toBe(true);
  });
});
