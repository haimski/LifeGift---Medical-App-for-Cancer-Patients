import { z } from "zod";

/** What the model may put in an extracted field value. */
const fieldValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/**
 * Validates the extraction tool's output. This is the boundary between
 * "whatever the model produced" and the typed data the rules engine and
 * route handler trust — see lib/llm/extraction.ts.
 */
export const extractionResultSchema = z.object({
  matchedGuidelineId: z.string().nullable(),
  possibleExcludedCondition: z.boolean(),
  extractedFields: z.record(z.string(), fieldValueSchema),
  missingRequiredFields: z.array(z.string()),
  followUpQuestion: z.string().nullable(),
  multipleSymptomsDetected: z.array(z.string()),
});
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

/**
 * Validates the phrasing tool's output. `grade` here is only used for
 * consistency logging (see phrasing.ts) — the frontend/route trust the
 * rules engine's grade, never this echoed one.
 */
export const phrasingResultSchema = z.object({
  grade: z.enum(["GREEN", "AMBER", "RED"]),
  message: z.string(),
});
export type PhrasingResult = z.infer<typeof phrasingResultSchema>;

/** Defensive validation of the incoming /api/chat request body. */
export const chatApiRequestSchema = z.object({
  patientContext: z.object({
    cancerType: z.string(),
    treatmentType: z.enum([
      "chemotherapy_sact",
      "immunotherapy",
      "radiotherapy",
      "targeted_therapy",
      "combination",
      "not_on_active_treatment",
    ]),
    helplineNumber: z.string(),
    recentSactWithin6Weeks: z.boolean(),
  }),
  conversationHistory: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["patient", "assistant"]),
      content: z.string(),
      timestamp: z.string(),
      grade: z.enum(["GREEN", "AMBER", "RED"]).optional(),
    })
  ),
  message: z.string().min(1),
  activeGuidelineId: z.string().nullable(),
  pendingFields: z.record(z.string(), fieldValueSchema),
  followUpRoundCount: z.number().int().min(0),
  pendingGuidelineQueue: z.array(z.string()),
});
