import type { PatientContext } from "@/lib/context/patientContext";
import type { RagGrade } from "@/types/api";

export type { PatientContext, RagGrade };

/** A single question the LLM extraction step should ask about if missing. */
export interface ScreeningField {
  id: string;
  question: string;
  type: "number" | "boolean" | "enum" | "text";
  enumOptions?: string[];
  required: boolean;
}

/** Structured facts extracted from the patient's free text for one turn. */
export type ExtractedFields = Record<string, string | number | boolean | null>;

export interface GradeEscalation {
  /** Evaluated only once this criterion has already matched. */
  condition: (fields: ExtractedFields, ctx: PatientContext) => boolean;
  escalateTo: RagGrade;
  /** Plain-language reason surfaced to the phrasing step, e.g. "you're on immunotherapy". */
  reason: string;
}

export interface GradeCriterion {
  grade: RagGrade;
  /** Short label matching the source guideline, e.g. "Grade 2 (Amber)". */
  label: string;
  /** Literal, patient-observable criteria text derived from the UKONS PDF. */
  description: string;
  matches: (fields: ExtractedFields, ctx: PatientContext) => boolean;
  /** Prescribed action, derived from the UKONS PDF. Ground truth for the phrasing step. */
  action: string;
  escalateIf?: GradeEscalation[];
}

export interface ToxicityGuideline {
  id: string;
  displayName: string;
  /** Synonyms/lay terms to help the extraction step route free text here. */
  aliases: string[];
  screeningFields: ScreeningField[];
  /** Not required to be pre-sorted — the engine evaluates worst grade first. */
  grades: GradeCriterion[];
  /** e.g. diarrhoea -> the immunotherapy/colitis pathway. */
  alternatePathwayIf?: {
    condition: (ctx: PatientContext) => boolean;
    useGuidelineId: string;
  };
  /** Shared AO-team/withhold-SACT text, appended once by the phrasing step — see boilerplate.ts. */
  boilerplateFooter: string;
}

/** Checked first, on every turn, cutting across whatever guideline is active. */
export interface GlobalOverrideRule {
  id: string;
  displayName: string;
  appliesIf: (fields: ExtractedFields, ctx: PatientContext) => boolean;
  grade: "RED";
  action: string;
}

export interface EvaluationResult {
  grade: RagGrade;
  guidelineId: string;
  gradeLabel: string;
  actionText: string;
  escalationReason?: string;
  source: "global_override" | "guideline" | "fail_safe";
}
