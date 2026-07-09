import { describe, expect, it } from "vitest";
import { resolveDisplayName } from "@/lib/triage/registry";

describe("resolveDisplayName", () => {
  it("resolves a regular guideline id to its displayName", () => {
    expect(resolveDisplayName("vomiting")).toBe("הקאות");
  });

  it("resolves the neutropenic sepsis override id (never in TOXICITY_GUIDELINES) to its own displayName", () => {
    expect(resolveDisplayName("neutropenic_sepsis_override")).toBe(
      "חשד לספסיס נויטרופני (Neutropenic Sepsis)"
    );
  });

  it("falls back to the raw id for the engine's own fail-safe ids", () => {
    expect(resolveDisplayName("unmatched")).toBe("unmatched");
  });
});
