import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { PHRASING_MODEL, getAnthropicClient } from "@/lib/llm/client";
import { phrasingResultSchema, type PhrasingResult } from "@/lib/llm/schemas";
import type { EvaluationResult, PatientContext } from "@/lib/triage/types";

const PHRASING_TOOL: Anthropic.Tool = {
  name: "phrase_result",
  description: "Return the patient-facing phrasing of a fixed clinical result.",
  input_schema: {
    type: "object",
    properties: {
      grade: {
        type: "string",
        enum: ["GREEN", "AMBER", "RED"],
        description: "Echo the grade you were given, verbatim — for consistency logging only.",
      },
      message: {
        type: "string",
        description: "The warm, plain-language patient-facing message.",
      },
    },
    required: ["grade", "message"],
  },
};

function buildSystemPrompt(patientContext: PatientContext): string {
  return `You are the phrasing step inside a cancer-symptom triage chat. You will be given a clinical result that has ALREADY been decided by a deterministic rules engine — a grade (Green/Amber/Red), and the action the patient needs to take.

Your ONLY job is to rephrase that result warmly, plainly, and briefly for a cancer patient (the patient's cancer type is ${patientContext.cancerType}, currently on ${patientContext.treatmentType}). You must NOT:
- change the grade
- add or remove any recommended action
- soften or omit urgency for Amber/Red results
- give any new clinical advice that wasn't in the input

Call the phrase_result tool with the grade echoed back exactly as given, and your rephrased message.`;
}

function buildUserPrompt(evaluation: EvaluationResult): string {
  const lines = [
    `Grade: ${evaluation.grade}`,
    `Assessment: ${evaluation.gradeLabel}`,
    `Required action: ${evaluation.actionText}`,
  ];
  if (evaluation.escalationReason) {
    lines.push(`Why this was escalated: ${evaluation.escalationReason}`);
  }
  return lines.join("\n");
}

/**
 * Turns a deterministic EvaluationResult into warm patient-facing prose.
 * The grade this returns is for consistency logging ONLY — callers must
 * always trust the EvaluationResult's own grade, never this echoed one.
 * Throws on API failure; callers should fall back to `evaluation.actionText`
 * verbatim rather than lose or downgrade a real grade because phrasing failed.
 */
export async function callPhrasing(
  evaluation: EvaluationResult,
  patientContext: PatientContext
): Promise<PhrasingResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: PHRASING_MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(patientContext),
    messages: [{ role: "user", content: buildUserPrompt(evaluation) }],
    tools: [PHRASING_TOOL],
    tool_choice: { type: "tool", name: PHRASING_TOOL.name },
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUseBlock) {
    throw new Error("Phrasing call did not return a tool_use block");
  }

  return phrasingResultSchema.parse(toolUseBlock.input);
}
