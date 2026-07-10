import { recordChatTurn } from "@/lib/db/sessions";
import { callExtraction } from "@/lib/llm/extraction";
import { callPhrasing } from "@/lib/llm/phrasing";
import { chatApiRequestSchema } from "@/lib/llm/schemas";
import { checkGlobalOverrides, evaluate, moreSevereEvaluation } from "@/lib/triage/engine";
import { findGuideline } from "@/lib/triage/registry";
import type { EvaluationResult, PatientContext } from "@/lib/triage/types";
import type { ChatApiResponse, PendingFields } from "@/types/api";

const FOLLOW_UP_ROUND_CAP = 3;
// EN: "Sorry, something went wrong on our end. To be safe, please contact
// your 24-hour helpline to discuss your symptoms."
const FAIL_SAFE_MESSAGE =
  "מצטערים, משהו השתבש אצלנו. ליתר ביטחון, אנא פנה/י לקו החירום הפעיל 24 שעות ביממה כדי לדווח על התסמינים שלך.";

function failSafeResponse(message: string): ChatApiResponse {
  return { type: "error_failsafe", assistantMessage: message, grade: "AMBER", redFlag: false };
}

/**
 * Persists the turn to Postgres, best-effort. Always called after the
 * response body is already fully computed — a DB outage must never delay,
 * alter, or break the patient-facing response, so failures here are only
 * logged, never thrown. Skips error_failsafe turns (extraction itself
 * failed, so there's no stable grade/guideline context worth recording).
 */
async function persistTurn(
  sessionId: string,
  patientContext: PatientContext,
  patientMessage: string,
  response: ChatApiResponse,
  evaluation?: EvaluationResult
): Promise<void> {
  if (response.type === "error_failsafe") return;
  try {
    await recordChatTurn({
      sessionId,
      patientContext,
      patientMessage,
      assistantMessage: response.assistantMessage,
      grade: evaluation?.grade,
      guidelineId: evaluation?.guidelineId,
      gradeLabel: evaluation?.gradeLabel,
      description: evaluation?.description,
      actionText: evaluation?.actionText,
    });
  } catch (err) {
    console.error("Failed to persist chat turn", err);
  }
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
    // EN: `You also mentioned ${displayName} — ${question}`
    return {
      extraMessage: `הזכרת גם ${nextGuideline.displayName} — ${firstRequiredField.question}`,
      nextActiveGuidelineId: nextGuideline.id,
      remainingQueue: rest,
      topLevelEvaluation: primaryEvaluation,
    };
  }

  // No required fields (e.g. chest pain, extravasation) — it grades
  // unconditionally, so evaluate it immediately rather than asking a
  // question that has no purpose.
  const secondaryEvaluation = evaluate({}, ctx, nextGuideline.id);
  // EN: `About the ${displayName} you mentioned: ${actionText}`
  return {
    extraMessage: `לגבי ${nextGuideline.displayName} שהזכרת: ${secondaryEvaluation.actionText}`,
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
      // EN: "Sorry, we couldn't read that message. Please try again, or
      // contact your 24-hour helpline if you're worried."
      failSafeResponse(
        "מצטערים, לא הצלחנו לקרוא את ההודעה הזו. אנא נסה/י שוב, או פנה/י לקו החירום הפעיל 24 שעות ביממה אם את/ה מודאג/ת."
      ),
      { status: 400 }
    );
  }

  const parsed = chatApiRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      // EN: "Sorry, something about that message wasn't quite right. Please
      // try again, or contact your 24-hour helpline if you're worried."
      failSafeResponse(
        "מצטערים, היה משהו לא תקין בהודעה הזו. אנא נסה/י שוב, או פנה/י לקו החירום הפעיל 24 שעות ביממה אם את/ה מודאג/ת."
      ),
      { status: 400 }
    );
  }

  const {
    sessionId,
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
    const response = await buildGradedResponse(overrideResult, patientContext, bridge);
    await persistTurn(sessionId, patientContext, message, response, bridge.topLevelEvaluation);
    return Response.json(response);
  }

  // Nothing symptom-related has come up yet (or ever) for this complaint —
  // there's no questionnaire in progress to time out on, so this is just
  // natural conversation (a greeting, thanks, a question about the app, an
  // off-topic remark) until something concrete emerges. Uses the model's
  // own natural assistantMessage directly; never touches the rules engine,
  // never grades, and deliberately doesn't increment followUpRoundCount —
  // that cap exists to stop looping on a real-but-unclear symptom, not to
  // eventually force-grade a conversation that was never about one.
  // possibleExcludedCondition still routes through the normal fail-safe
  // logic below, since that's a genuine (if out-of-scope) safety concern.
  if (
    resolvedGuidelineId === null &&
    !extraction.possibleExcludedCondition &&
    mergedQueue.length === 0
  ) {
    const followUp: ChatApiResponse = {
      type: "follow_up",
      assistantMessage: extraction.assistantMessage,
      activeGuidelineId: null,
      pendingFields: {},
      followUpRoundCount,
      pendingGuidelineQueue: mergedQueue,
    };
    await persistTurn(sessionId, patientContext, message, followUp);
    return Response.json(followUp);
  }

  const hasMissingFields = extraction.missingRequiredFields.length > 0;
  const capExceeded = followUpRoundCount >= FOLLOW_UP_ROUND_CAP;

  if (hasMissingFields && !capExceeded && !extraction.possibleExcludedCondition) {
    const followUp: ChatApiResponse = {
      type: "follow_up",
      assistantMessage: extraction.assistantMessage,
      activeGuidelineId: resolvedGuidelineId,
      pendingFields: mergedFields,
      followUpRoundCount: followUpRoundCount + 1,
      pendingGuidelineQueue: mergedQueue,
    };
    await persistTurn(sessionId, patientContext, message, followUp);
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
  const response = await buildGradedResponse(evaluation, patientContext, bridge);
  await persistTurn(sessionId, patientContext, message, response, bridge.topLevelEvaluation);
  return Response.json(response);
}
