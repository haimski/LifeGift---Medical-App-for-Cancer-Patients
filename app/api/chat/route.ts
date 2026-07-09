import { callExtraction } from "@/lib/llm/extraction";
import { callPhrasing } from "@/lib/llm/phrasing";
import { chatApiRequestSchema } from "@/lib/llm/schemas";
import { checkGlobalOverrides, evaluate, moreSevereEvaluation } from "@/lib/triage/engine";
import { findGuideline } from "@/lib/triage/registry";
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

/** Adds newly-detected guideline ids to the queue, skipping the one currently being handled and any duplicates. */
function mergeGuidelineQueue(
  existingQueue: string[],
  newlyDetected: string[],
  excludeId: string | null
): string[] {
  const queue = [...existingQueue];
  for (const id of newlyDetected) {
    if (id !== excludeId && !queue.includes(id)) queue.push(id);
  }
  return queue;
}

interface BridgeResult {
  /** Deterministic text to append after the primary's phrased message — a follow-up question or a second guideline's raw action text. */
  extraMessage: string | null;
  /** Set when bridging into a guideline that needs a follow-up question — becomes the next turn's activeGuidelineId. */
  nextActiveGuidelineId: string | null;
  remainingQueue: string[];
  /** The more severe of the primary/any immediately-evaluated secondary — governs the response's top-level grade/redFlag. */
  topLevelEvaluation: EvaluationResult;
}

/**
 * Implements the plan's "Multi-symptom investigation" behaviour: co-
 * mentioned guidelines queue up and get addressed once the current
 * complaint is resolved, per the UKONS principle that concurrent
 * toxicities elevate risk and must be asked about. Never runs when the
 * primary evaluation is Red — the emergency dominates, and the queue is
 * simply dropped rather than surfaced later in the same conversation.
 */
function bridgeToNextQueued(
  primaryEvaluation: EvaluationResult,
  queue: string[],
  ctx: PatientContext
): BridgeResult {
  if (primaryEvaluation.grade === "RED" || queue.length === 0) {
    return {
      extraMessage: null,
      nextActiveGuidelineId: null,
      remainingQueue: [],
      topLevelEvaluation: primaryEvaluation,
    };
  }

  const [nextId, ...rest] = queue;
  const nextGuideline = findGuideline(nextId);
  if (!nextGuideline) {
    return {
      extraMessage: null,
      nextActiveGuidelineId: null,
      remainingQueue: rest,
      topLevelEvaluation: primaryEvaluation,
    };
  }

  const firstRequiredField = nextGuideline.screeningFields.find((f) => f.required);
  if (firstRequiredField) {
    return {
      extraMessage: `You also mentioned ${nextGuideline.displayName.toLowerCase()} — ${firstRequiredField.question}`,
      nextActiveGuidelineId: nextGuideline.id,
      remainingQueue: rest,
      topLevelEvaluation: primaryEvaluation,
    };
  }

  // No required fields (e.g. chest pain, extravasation) — it grades
  // unconditionally, so evaluate it immediately rather than asking a
  // question that has no purpose.
  const secondaryEvaluation = evaluate({}, ctx, nextGuideline.id);
  return {
    extraMessage: `About the ${nextGuideline.displayName.toLowerCase()} you mentioned: ${secondaryEvaluation.actionText}`,
    nextActiveGuidelineId: null,
    remainingQueue: rest,
    topLevelEvaluation: moreSevereEvaluation(primaryEvaluation, secondaryEvaluation),
  };
}

/**
 * Turns a deterministic EvaluationResult into the API response, phrasing
 * it warmly via the LLM. If phrasing itself fails, falls back to the
 * engine's own action text verbatim — a phrasing outage must never lose
 * or downgrade an already-decided grade (especially a Red one).
 */
async function buildGradedResponse(
  primaryEvaluation: EvaluationResult,
  patientContext: PatientContext,
  bridge: BridgeResult
): Promise<ChatApiResponse> {
  let assistantMessage: string = primaryEvaluation.actionText;
  try {
    const phrased = await callPhrasing(primaryEvaluation, patientContext);
    assistantMessage = phrased.message;
  } catch (err) {
    console.error("Phrasing call failed; falling back to raw action text", err);
  }

  if (bridge.extraMessage) {
    assistantMessage = `${assistantMessage}\n\n${bridge.extraMessage}`;
  }

  const { topLevelEvaluation } = bridge;
  return {
    type: "graded",
    assistantMessage,
    grade: topLevelEvaluation.grade,
    guidelineId: topLevelEvaluation.guidelineId,
    actionSummary: topLevelEvaluation.actionText,
    redFlag: topLevelEvaluation.grade === "RED",
    helplineNumber: patientContext.helplineNumber,
    nextActiveGuidelineId: bridge.nextActiveGuidelineId,
    pendingGuidelineQueue: bridge.remainingQueue,
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
    pendingGuidelineQueue,
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
  const mergedQueue = mergeGuidelineQueue(
    pendingGuidelineQueue,
    extraction.multipleSymptomsDetected,
    resolvedGuidelineId
  );

  // Global overrides (e.g. neutropenic sepsis) are checked before we even
  // look at whether the active guideline's own required fields are
  // complete — sepsis risk shouldn't wait for the symptom questionnaire to
  // finish. See engine.ts's checkGlobalOverrides doc comment.
  const overrideResult = checkGlobalOverrides(mergedFields, patientContext);
  if (overrideResult) {
    // Red always dominates — the queue is dropped, not carried forward.
    const bridge = bridgeToNextQueued(overrideResult, mergedQueue, patientContext);
    return Response.json(await buildGradedResponse(overrideResult, patientContext, bridge));
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
      pendingGuidelineQueue: mergedQueue,
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

  const bridge = bridgeToNextQueued(evaluation, mergedQueue, patientContext);
  return Response.json(await buildGradedResponse(evaluation, patientContext, bridge));
}
