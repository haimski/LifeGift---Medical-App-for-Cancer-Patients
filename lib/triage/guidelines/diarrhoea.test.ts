import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/triage/engine";
import type { PatientContext } from "@/lib/triage/types";

const chemoCtx: PatientContext = {
  cancerType: "Bowel",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: false,
};

const immunotherapyCtx: PatientContext = {
  ...chemoCtx,
  treatmentType: "immunotherapy",
};

describe("diarrhoea guideline (non-immunotherapy)", () => {
  it("grades no change from baseline as Green", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 0, hasBloodInStool: false },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("GREEN");
  });

  it("grades a mild increase as Amber (Grade 1)", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 2, hasBloodInStool: false },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("AMBER");
    expect(result.gradeLabel).toBe("Grade 1 (Amber)");
  });

  it("grades 4-6 episodes as Amber (Grade 2)", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 5, hasBloodInStool: false },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("AMBER");
    expect(result.gradeLabel).toBe("Grade 2 (Amber)");
  });

  it("grades 8 episodes a day as Red (Grade 3)", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 8, hasBloodInStool: false },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("RED");
    expect(result.gradeLabel).toBe("Grade 3 (Red)");
  });

  it("grades 12 episodes a day as Red (Grade 4)", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 12, hasBloodInStool: false },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("RED");
    expect(result.gradeLabel).toBe("Grade 4 (Red)");
  });

  it("escalates a Grade 2 count to Red if it has persisted >24h despite medication", () => {
    const result = evaluate(
      {
        stoolsPerDayOverBaseline: 5,
        hasBloodInStool: false,
        persistedDespiteMedication24h: true,
      },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("RED");
    expect(result.escalationReason).toMatch(/24 hours/);
  });

  it("treats any blood in stool as Red regardless of episode count", () => {
    const result = evaluate(
      { stoolsPerDayOverBaseline: 1, hasBloodInStool: true },
      chemoCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("RED");
  });
});

describe("diarrhoea guideline routes to the colitis pathway on immunotherapy", () => {
  it("redirects to the immunotherapy guideline id", () => {
    const result = evaluate(
      {
        stoolsPerDayOverBaseline: 1,
        hasAbdominalPainOrCramping: false,
        hasMucusOrBloodInStool: false,
      },
      immunotherapyCtx,
      "diarrhoea"
    );
    expect(result.guidelineId).toBe("diarrhoea_colitis_immunotherapy");
  });

  it("grades a count that would only be Amber on the standard pathway as Red", () => {
    const result = evaluate(
      {
        stoolsPerDayOverBaseline: 4,
        hasAbdominalPainOrCramping: false,
        hasMucusOrBloodInStool: false,
      },
      immunotherapyCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("RED");
  });

  it("grades a mild count with no pain/blood/mucus as Amber", () => {
    const result = evaluate(
      {
        stoolsPerDayOverBaseline: 2,
        hasAbdominalPainOrCramping: false,
        hasMucusOrBloodInStool: false,
      },
      immunotherapyCtx,
      "diarrhoea"
    );
    expect(result.grade).toBe("AMBER");
  });
});
