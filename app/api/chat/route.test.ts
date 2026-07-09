import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/llm/extraction", () => ({
  callExtraction: vi.fn(),
}));
vi.mock("@/lib/llm/phrasing", () => ({
  callPhrasing: vi.fn(),
}));

import { callExtraction } from "@/lib/llm/extraction";
import { callPhrasing } from "@/lib/llm/phrasing";
import type { ExtractionResult } from "@/lib/llm/schemas";
import type { PatientContext } from "@/lib/triage/types";
import type { ChatApiResponse } from "@/types/api";
import { POST } from "@/app/api/chat/route";

const mockedExtraction = vi.mocked(callExtraction);
const mockedPhrasing = vi.mocked(callPhrasing);

const patientContext: PatientContext = {
  cancerType: "Breast",
  treatmentType: "chemotherapy_sact",
  helplineNumber: "01234 567890",
  recentSactWithin6Weeks: true,
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function baseRequestBody(overrides: Record<string, unknown> = {}) {
  return {
    patientContext,
    conversationHistory: [],
    message: "test message",
    activeGuidelineId: null,
    pendingFields: {},
    followUpRoundCount: 0,
    pendingGuidelineQueue: [],
    ...overrides,
  };
}

function extraction(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  return {
    matchedGuidelineId: null,
    possibleExcludedCondition: false,
    extractedFields: {},
    missingRequiredFields: [],
    followUpQuestion: null,
    multipleSymptomsDetected: [],
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("/api/chat route", () => {
  it("returns a follow_up response when required fields are missing", async () => {
    mockedExtraction.mockResolvedValue(
      extraction({
        matchedGuidelineId: "vomiting",
        missingRequiredFields: ["vomitingEpisodesLast24h"],
        followUpQuestion: "How many times have you been sick today?",
      })
    );

    const res = await POST(makeRequest(baseRequestBody({ message: "I've been sick" })));
    const body = (await res.json()) as ChatApiResponse;

    expect(body.type).toBe("follow_up");
    if (body.type === "follow_up") {
      expect(body.assistantMessage).toBe("How many times have you been sick today?");
      expect(body.activeGuidelineId).toBe("vomiting");
      expect(body.followUpRoundCount).toBe(1);
    }
    expect(mockedPhrasing).not.toHaveBeenCalled();
  });

  it("grades a Red result and trusts the engine's grade, not the LLM's echoed one", async () => {
    mockedExtraction.mockResolvedValue(
      extraction({
        matchedGuidelineId: "diarrhoea",
        extractedFields: { stoolsPerDayOverBaseline: 8, hasBloodInStool: false },
      })
    );
    // Deliberately mismatched, to prove the frontend/route never trusts this.
    mockedPhrasing.mockResolvedValue({ grade: "AMBER", message: "some mismatched phrasing" });

    const res = await POST(
      makeRequest(baseRequestBody({ message: "8 times today", activeGuidelineId: "diarrhoea" }))
    );
    const body = (await res.json()) as ChatApiResponse;

    expect(body.type).toBe("graded");
    if (body.type === "graded") {
      expect(body.grade).toBe("RED");
      expect(body.redFlag).toBe(true);
      expect(body.assistantMessage).toBe("some mismatched phrasing");
    }
  });

  it("fires the global override even when the active guideline's own fields would only justify Amber", async () => {
    mockedExtraction.mockResolvedValue(
      extraction({
        matchedGuidelineId: "diarrhoea",
        extractedFields: {
          stoolsPerDayOverBaseline: 2,
          hasBloodInStool: false,
          temperatureC: 38,
        },
      })
    );
    mockedPhrasing.mockResolvedValue({ grade: "RED", message: "urgent phrased message" });

    const res = await POST(
      makeRequest(
        baseRequestBody({
          message: "mild diarrhoea but also a temperature",
          activeGuidelineId: "diarrhoea",
        })
      )
    );
    const body = (await res.json()) as ChatApiResponse;

    expect(body.type).toBe("graded");
    if (body.type === "graded") {
      expect(body.grade).toBe("RED");
      expect(body.redFlag).toBe(true);
      expect(body.guidelineId).toBe("neutropenic_sepsis_override");
    }
  });

  it("falls back to the engine's raw action text if phrasing fails, without losing the grade", async () => {
    mockedExtraction.mockResolvedValue(
      extraction({
        matchedGuidelineId: "vomiting",
        extractedFields: { vomitingEpisodesLast24h: 12 },
      })
    );
    mockedPhrasing.mockRejectedValue(new Error("network error"));

    const res = await POST(
      makeRequest(baseRequestBody({ message: "vomited 12 times", activeGuidelineId: "vomiting" }))
    );
    const body = (await res.json()) as ChatApiResponse;

    expect(body.type).toBe("graded");
    if (body.type === "graded") {
      expect(body.grade).toBe("RED");
      expect(body.redFlag).toBe(true);
      expect(body.assistantMessage).toBe(body.actionSummary);
    }
  });

  it("returns error_failsafe (Amber, not a crash or Green) when extraction itself fails", async () => {
    mockedExtraction.mockRejectedValue(new Error("Anthropic API unreachable"));

    const res = await POST(makeRequest(baseRequestBody({ message: "anything" })));
    const body = (await res.json()) as ChatApiResponse;

    expect(body.type).toBe("error_failsafe");
    if (body.type === "error_failsafe") {
      expect(body.grade).toBe("AMBER");
      expect(body.redFlag).toBe(false);
    }
    expect(mockedPhrasing).not.toHaveBeenCalled();
  });

  it("returns error_failsafe for a malformed request body", async () => {
    const res = await POST(makeRequest({ nonsense: true }));
    const body = (await res.json()) as ChatApiResponse;
    expect(body.type).toBe("error_failsafe");
    expect(res.status).toBe(400);
  });

  it("stops asking follow-up questions once the round cap is hit and fails safe on what's known", async () => {
    mockedExtraction.mockResolvedValue(
      extraction({
        matchedGuidelineId: "vomiting",
        missingRequiredFields: ["vomitingEpisodesLast24h"],
        followUpQuestion: "How many times?",
      })
    );
    mockedPhrasing.mockResolvedValue({ grade: "AMBER", message: "phrased fail-safe message" });

    const res = await POST(
      makeRequest(
        baseRequestBody({
          message: "I don't really know",
          activeGuidelineId: "vomiting",
          followUpRoundCount: 3,
        })
      )
    );
    const body = (await res.json()) as ChatApiResponse;

    expect(body.type).toBe("graded");
    if (body.type === "graded") {
      // No episode count was ever extracted, so the vomiting guideline's
      // own criteria can't match anything -> the engine fails safe to
      // Amber itself, rather than the route looping forever.
      expect(body.grade).toBe("AMBER");
    }
  });

  describe("multi-symptom investigation", () => {
    it("bridges into a queued co-mentioned guideline that has required fields, as a deterministic question", async () => {
      mockedExtraction.mockResolvedValue(
        extraction({
          matchedGuidelineId: "vomiting",
          extractedFields: { vomitingEpisodesLast24h: 2 },
          multipleSymptomsDetected: ["mucositis"],
        })
      );
      mockedPhrasing.mockResolvedValue({ grade: "GREEN", message: "phrased vomiting message" });

      const res = await POST(
        makeRequest(
          baseRequestBody({
            message: "sick twice today and my mouth is sore",
            activeGuidelineId: "vomiting",
          })
        )
      );
      const body = (await res.json()) as ChatApiResponse;

      expect(body.type).toBe("graded");
      if (body.type === "graded") {
        expect(body.grade).toBe("GREEN");
        expect(body.nextActiveGuidelineId).toBe("mucositis");
        expect(body.pendingGuidelineQueue).toEqual([]);
        expect(body.assistantMessage).toContain("phrased vomiting message");
        expect(body.assistantMessage).toContain("רירית");
      }
    });

    it("evaluates a queued guideline with no required fields immediately, and escalates the top-level grade if it's more severe", async () => {
      mockedExtraction.mockResolvedValue(
        extraction({
          matchedGuidelineId: "vomiting",
          extractedFields: { vomitingEpisodesLast24h: 1 },
          multipleSymptomsDetected: ["chest_pain"],
        })
      );
      mockedPhrasing.mockResolvedValue({ grade: "GREEN", message: "phrased vomiting message" });

      const res = await POST(
        makeRequest(
          baseRequestBody({
            message: "only sick once but I also have some chest pain",
            activeGuidelineId: "vomiting",
          })
        )
      );
      const body = (await res.json()) as ChatApiResponse;

      expect(body.type).toBe("graded");
      if (body.type === "graded") {
        // chest_pain grades Red unconditionally -> must win over the
        // primary complaint's Green, even though vomiting was mentioned first.
        expect(body.grade).toBe("RED");
        expect(body.redFlag).toBe(true);
        expect(body.guidelineId).toBe("chest_pain");
        expect(body.nextActiveGuidelineId).toBeNull();
        expect(body.assistantMessage).toContain("כאב בחזה");
      }
    });

    it("discards the queue entirely when the primary complaint itself grades Red", async () => {
      mockedExtraction.mockResolvedValue(
        extraction({
          matchedGuidelineId: "diarrhoea",
          extractedFields: { stoolsPerDayOverBaseline: 8, hasBloodInStool: false },
          multipleSymptomsDetected: ["mucositis"],
        })
      );
      mockedPhrasing.mockResolvedValue({ grade: "RED", message: "urgent diarrhoea message" });

      const res = await POST(
        makeRequest(
          baseRequestBody({
            message: "diarrhoea 8 times and my mouth is a bit sore too",
            activeGuidelineId: "diarrhoea",
          })
        )
      );
      const body = (await res.json()) as ChatApiResponse;

      expect(body.type).toBe("graded");
      if (body.type === "graded") {
        expect(body.grade).toBe("RED");
        expect(body.nextActiveGuidelineId).toBeNull();
        expect(body.pendingGuidelineQueue).toEqual([]);
        expect(body.assistantMessage).not.toContain("רירית");
      }
    });

    it("accumulates multipleSymptomsDetected into the queue across follow_up turns", async () => {
      mockedExtraction.mockResolvedValue(
        extraction({
          matchedGuidelineId: "vomiting",
          missingRequiredFields: ["vomitingEpisodesLast24h"],
          followUpQuestion: "How many times have you been sick?",
          multipleSymptomsDetected: ["mucositis"],
        })
      );

      const res = await POST(
        makeRequest(
          baseRequestBody({
            message: "I've been sick and my mouth hurts",
            activeGuidelineId: "vomiting",
            pendingGuidelineQueue: ["rash"],
          })
        )
      );
      const body = (await res.json()) as ChatApiResponse;

      expect(body.type).toBe("follow_up");
      if (body.type === "follow_up") {
        expect(body.pendingGuidelineQueue).toEqual(["rash", "mucositis"]);
      }
    });
  });
});
