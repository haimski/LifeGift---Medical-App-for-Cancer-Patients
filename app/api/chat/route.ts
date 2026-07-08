import { callExtraction } from "@/lib/llm/extraction";
import { callPhrasing } from "@/lib/llm/phrasing";
import { chatApiRequestSchema } from "@/lib/llm/schemas";
import { checkGlobalOverrides, evaluate } from "@/lib/triage/engine";
import type { EvaluationResult, PatientContext } from "@/lib/triage/types";
import type { ChatApiResponse, PendingFields } from "@/types/api";

const FOLLOW_UP_ROUND_CAP = 3;
const FAIL_SAFE_MESSAGE =
  "Sorry, something went wrong on our end. To be safe, please contact your 24-hour helpline to discuss your symptoms.";

function failSafeResponse(message: string): ChatApiResponse {
  return { type: "error_failsafe", assistantMessage: message, grade: "AMBER", redFlag: false };
}

/** Never lets a null overwrite a value already known from an earlier turn. */
function mergeFields(pending: PendingFields, extracted: PendingFields): PendingFields {
  const merged = { ...pending };
  for (const [key, value] of Object.entries(extracted)) {
    if (value !== null) merged[key] = value;
  }
  return merged;
}

/**
 * Turns a deterministic EvaluationResult into the API response, phrasing
 * it warmly via the LLM. If phrasing itself fails, falls back to the
 * engine's own action text verbatim — a phrasing outage must never lose
 * or downgrade an already-decided grade (especially a Red one).
 */
async function buildGradedResponse(
  evaluation: EvaluationResult,
  patientContext: PatientContext
): Promise<ChatApiResponse> {
  let assistantMessage: string = evaluation.actionText;
  try {
    const phrased = await callPhrasing(evaluation, patientContext);
    assistantMessage = phrased.message;
  } catch (err) {
    console.error("Phrasing call failed; falling back to raw action text", err);
  }

  return {
    type: "graded",
    assistantMessage,
    grade: evaluation.grade,
    guidelineId: evaluation.guidelineId,
    actionSummary: evaluation.actionText,
    redFlag: evaluation.grade === "RED",
    helplineNumber: patientContext.helplineNumber,
  };
}

export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      failSafeResponse(
        "Sorry, we couldn't read that message. Please try again, or contact your 24-hour helpline if you're worried."
      ),
      { status: 400 }
    );
  }

  const parsed = chatApiRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      failSafeResponse(
        "Sorry, something about that message wasn't quite right. Please try again, or contact your 24-hour helpline if you're worried."
      ),
      { status: 400 }
    );
  }

  const {
    patientContext,
    conversationHistory,
    message,
    activeGuidelineId,
    pendingFields,
    followUpRoundCount,
  } = parsed.data;

  let extraction;
  try {
    extraction = await callExtraction({
      patientContext,
      conversationHistory,
      message,
      activeGuidelineId,
      pendingFields,
    });
  } catch (err) {
    console.error("Extraction call failed", err);
    return Response.json(failSafeResponse(FAIL_SAFE_MESSAGE));
  }

  const mergedFields = mergeFields(pendingFields, extraction.extractedFields);
  const resolvedGuidelineId = extraction.matchedGuidelineId ?? activeGuidelineId;

  // Global overrides (e.g. neutropenic sepsis) are checked before we even
  // look at whether the active guideline's own required fields are
  // complete — sepsis risk shouldn't wait for the symptom questionnaire to
  // finish. See engine.ts's checkGlobalOverrides doc comment.
  const overrideResult = checkGlobalOverrides(mergedFields, patientContext);
  if (overrideResult) {
    return Response.json(await buildGradedResponse(overrideResult, patientContext));
  }

  const hasMissingFields = extraction.missingRequiredFields.length > 0;
  const capExceeded = followUpRoundCount >= FOLLOW_UP_ROUND_CAP;

  if (hasMissingFields && !capExceeded && !extraction.possibleExcludedCondition) {
    const followUp: ChatApiResponse = {
      type: "follow_up",
      assistantMessage:
        extraction.followUpQuestion ?? "Can you tell me a bit more about that?",
      activeGuidelineId: resolvedGuidelineId,
      pendingFields: mergedFields,
      followUpRoundCount: followUpRoundCount + 1,
    };
    return Response.json(followUp);
  }

  // Either everything required is known, or we've asked enough follow-up
  // questions — grade on what we have. If key fields are still null, the
  // engine's own criteria won't match anything and it fails safe to Amber
  // itself (see engine.ts step 5), rather than looping forever.
  const evaluation = evaluate(mergedFields, patientContext, resolvedGuidelineId, {
    possibleExcludedCondition: extraction.possibleExcludedCondition,
  });

  return Response.json(await buildGradedResponse(evaluation, patientContext));
}
