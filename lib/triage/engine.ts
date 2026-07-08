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

const FAIL_SAFE_ACTION =
  "We couldn't confidently match this to a specific guideline, so to be safe: please contact your 24-hour oncology helpline to talk through what you're experiencing.";

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
      gradeLabel: "Unmatched — fail-safe",
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
    gradeLabel: "Unclear severity — fail-safe",
    actionText: FAIL_SAFE_ACTION,
    source: "fail_safe",
  };
}
