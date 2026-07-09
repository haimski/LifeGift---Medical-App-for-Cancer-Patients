import { GLOBAL_OVERRIDE_RULES, TOXICITY_GUIDELINES, findGuideline } from "@/lib/triage/registry";
import type {
  EvaluationResult,
  ExtractedFields,
  GradeCriterion,
  PatientContext,
  RagGrade,
} from "@/lib/triage/types";

const SEVERITY_ORDER: Record<RagGrade, number> = { GREEN: 0, AMBER: 1, RED: 2 };

function isMoreSevere(a: RagGrade, b: RagGrade): boolean {
  return SEVERITY_ORDER[a] > SEVERITY_ORDER[b];
}

function worstFirst(grades: GradeCriterion[]): GradeCriterion[] {
  return [...grades].sort((a, b) => SEVERITY_ORDER[b.grade] - SEVERITY_ORDER[a.grade]);
}

/**
 * Picks the more severe of two evaluations — used when a turn grades more
 * than one guideline at once (e.g. bridging into a queued co-mentioned
 * guideline that needs no follow-up questions, see /api/chat's
 * multi-symptom handling). A Red result must never be shadowed by an
 * Amber/Green one reported alongside it in the same turn.
 */
export function moreSevereEvaluation(a: EvaluationResult, b: EvaluationResult): EvaluationResult {
  return SEVERITY_ORDER[b.grade] > SEVERITY_ORDER[a.grade] ? b : a;
}

// EN: "We couldn't confidently match this to a specific guideline, so to be
// safe: please contact your 24-hour oncology helpline to talk through what
// you're experiencing." — this is genuinely patient-facing (the fallback
// text if phrasing itself fails, per buildGradedResponse in route.ts), so
// it was a gap that this stayed English through Phase 6.2; fixed here.
const FAIL_SAFE_ACTION =
  "לא הצלחנו להתאים את זה בביטחון להנחיה ספציפית, אז ליתר ביטחון: אנא פנה/י לקו החירום האונקולוגי הפעיל 24 שעות ביממה כדי לדבר על מה שאת/ה חווה.";
// EN: "No guideline matched this message closely enough to grade automatically."
const FAIL_SAFE_UNMATCHED_DESCRIPTION =
  "אף הנחיה לא תאמה את ההודעה הזו מספיק כדי לדרג אוטומטית.";
// EN: "The matched guideline's fields didn't clearly fit any of its grade bands."
const FAIL_SAFE_UNCLEAR_DESCRIPTION =
  "השדות של ההנחיה המתאימה לא התאימו בבירור לאף אחת מרמות החומרה שלה.";

/**
 * Checks only the global override rules (e.g. neutropenic sepsis),
 * independent of any guideline-specific grading. Exposed separately from
 * `evaluate()` so callers (the /api/chat route) can short-circuit to Red
 * the moment an override fires — even mid-conversation, before a
 * guideline's own required fields are complete. Returns null if nothing
 * overrides.
 */
export function checkGlobalOverrides(
  fields: ExtractedFields,
  ctx: PatientContext
): EvaluationResult | null {
  for (const rule of GLOBAL_OVERRIDE_RULES) {
    if (rule.appliesIf(fields, ctx)) {
      return {
        grade: "RED",
        guidelineId: rule.id,
        gradeLabel: rule.displayName,
        description: rule.description,
        actionText: rule.action,
        source: "global_override",
      };
    }
  }
  return null;
}

/**
 * The deterministic safety core of the app. Never call an LLM from in
 * here — every grade this function returns must be traceable to a literal
 * criterion in lib/triage/guidelines/*.ts or a global override rule. See
 * README's "Safety architecture" section.
 */
export function evaluate(
  fields: ExtractedFields,
  ctx: PatientContext,
  guidelineId: string | null,
  options?: { possibleExcludedCondition?: boolean }
): EvaluationResult {
  // 1. Global overrides run first, on every turn, regardless of which
  //    guideline is active — see neutropenic-sepsis.ts's doc comment.
  const overrideResult = checkGlobalOverrides(fields, ctx);
  if (overrideResult) return overrideResult;

  // 2. Resolve the active guideline, following an alternate pathway
  //    (e.g. diarrhoea -> colitis) if the patient context requires it.
  let guideline = findGuideline(guidelineId);
  if (guideline?.alternatePathwayIf?.condition(ctx)) {
    const alternate = TOXICITY_GUIDELINES.find(
      (g) => g.id === guideline!.alternatePathwayIf!.useGuidelineId
    );
    if (alternate) guideline = alternate;
  }

  if (!guideline || options?.possibleExcludedCondition) {
    // 3. No matched guideline (or a suspected excluded/lab-based condition):
    //    fail-safe to Amber. Never fall through to Green by default.
    return {
      grade: "AMBER",
      guidelineId: guideline?.id ?? "unmatched",
      // EN: "Unmatched — fail-safe"
      gradeLabel: "לא הותאם — ליתר ביטחון",
      description: FAIL_SAFE_UNMATCHED_DESCRIPTION,
      actionText: FAIL_SAFE_ACTION,
      source: "fail_safe",
    };
  }

  // 4. Evaluate grade criteria worst-first: the first (most severe) match
  //    wins, not the lowest, in case a patient's numbers satisfy more than
  //    one band's description.
  for (const criterion of worstFirst(guideline.grades)) {
    if (!criterion.matches(fields, ctx)) continue;

    let grade = criterion.grade;
    let escalationReason: string | undefined;

    for (const escalation of criterion.escalateIf ?? []) {
      if (escalation.condition(fields, ctx) && isMoreSevere(escalation.escalateTo, grade)) {
        grade = escalation.escalateTo;
        escalationReason = escalation.reason;
      }
    }

    return {
      grade,
      guidelineId: guideline.id,
      gradeLabel: criterion.label,
      description: criterion.description,
      actionText: criterion.action,
      escalationReason,
      source: "guideline",
    };
  }

  // 5. Fields present but didn't cleanly fit any band (e.g. contradictory
  //    extraction) — fail-safe to Amber rather than silently doing nothing.
  return {
    grade: "AMBER",
    guidelineId: guideline.id,
    // EN: "Unclear severity — fail-safe"
    gradeLabel: "חומרה לא ברורה — ליתר ביטחון",
    description: FAIL_SAFE_UNCLEAR_DESCRIPTION,
    actionText: FAIL_SAFE_ACTION,
    source: "fail_safe",
  };
}
