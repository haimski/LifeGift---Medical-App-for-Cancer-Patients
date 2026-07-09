import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_MODEL, getAnthropicClient } from "@/lib/llm/client";
import { extractionResultSchema, type ExtractionResult } from "@/lib/llm/schemas";
import { GLOBAL_OVERRIDE_SCREENING_FIELDS } from "@/lib/triage/global-rules/neutropenic-sepsis";
import { TOXICITY_GUIDELINES } from "@/lib/triage/registry";
import type { PatientContext } from "@/lib/triage/types";
import type { ChatMessage, PendingFields } from "@/types/api";

const MAX_HISTORY_MESSAGES = 10;

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "extract_symptom_data",
  description:
    "Record which known guideline the patient's message matches and what structured fields can be determined from it.",
  input_schema: {
    type: "object",
    properties: {
      matchedGuidelineId: {
        type: ["string", "null"],
        description:
          "The id of the best-matching known guideline (from the catalog in the system prompt), or null if none apply.",
      },
      possibleExcludedCondition: {
        type: "boolean",
        description:
          "True if the message suggests a condition outside the known guidelines that still sounds like a serious lab-based/immune-related adverse event or clinician-only workflow.",
      },
      extractedFields: {
        type: "object",
        description:
          "Field id -> value, for every field you can confidently determine from the conversation so far. Use null for anything unknown. Numbers as numbers, yes/no as booleans.",
        additionalProperties: true,
      },
      missingRequiredFields: {
        type: "array",
        items: { type: "string" },
        description: "Required field ids for the matched guideline that are still unknown.",
      },
      followUpQuestion: {
        type: ["string", "null"],
        description:
          "A short, warm, single question to ask next if there are missing required fields; otherwise null.",
      },
      multipleSymptomsDetected: {
        type: "array",
        items: { type: "string" },
        description:
          "Guideline ids of any OTHER known guidelines also plausibly mentioned in this same message.",
      },
    },
    required: [
      "matchedGuidelineId",
      "possibleExcludedCondition",
      "extractedFields",
      "missingRequiredFields",
      "followUpQuestion",
      "multipleSymptomsDetected",
    ],
  },
};

function buildGuidelineCatalog(): string {
  const lines: string[] = [];
  for (const guideline of TOXICITY_GUIDELINES) {
    const aliasText = guideline.aliases.length ? guideline.aliases.join(", ") : "none";
    lines.push(`- id: "${guideline.id}" — ${guideline.displayName} (aliases: ${aliasText})`);
    for (const field of guideline.screeningFields) {
      lines.push(
        `    • ${field.id} (${field.type}${field.required ? ", required" : ""}): ${field.question}`
      );
    }
  }
  lines.push(
    "- Always also try to extract these, regardless of matched guideline (a separate safety check uses them every turn):"
  );
  for (const field of GLOBAL_OVERRIDE_SCREENING_FIELDS) {
    lines.push(`    • ${field.id} (${field.type}): ${field.question}`);
  }
  return lines.join("\n");
}

interface CallExtractionParams {
  patientContext: PatientContext;
  conversationHistory: ChatMessage[];
  message: string;
  activeGuidelineId: string | null;
  pendingFields: PendingFields;
}

function buildSystemPrompt({
  patientContext,
  activeGuidelineId,
  pendingFields,
}: CallExtractionParams): string {
  const focusLine = activeGuidelineId
    ? `The conversation is currently focused on guideline "${activeGuidelineId}". Already-known fields so far: ${JSON.stringify(pendingFields)}.`
    : "No guideline is locked in yet for this complaint — figure out which one (if any) matches this message.";

  return `You are the symptom-understanding step inside a cancer-symptom triage chat. Your ONLY job is to call the extract_symptom_data tool — you do NOT grade severity, diagnose, or give medical advice. A separate deterministic rules engine does the grading from the fields you extract, so accuracy here matters more than being helpful-sounding.

The patient writes in Hebrew — read their messages as Hebrew and write followUpQuestion in Hebrew too, matching the warm, plain register already used in the guideline catalog below. The guideline ids and field ids below stay in English (internal identifiers only, never shown to the patient); their question/displayName text is already in Hebrew.

Patient context:
- Cancer type: ${patientContext.cancerType}
- Current treatment: ${patientContext.treatmentType}
- Treatment (including tablets) in the last 6 weeks: ${patientContext.recentSactWithin6Weeks ? "yes" : "no"}

${focusLine}

Known guidelines and their fields:
${buildGuidelineCatalog()}

Excluded conditions — set possibleExcludedCondition: true if the message plausibly matches one of these instead of a known guideline, and do NOT invent fields for them: adrenal crisis, hypophysitis/pituitary problems, thyroid dysfunction, hepatotoxicity/jaundice, neurological immune reactions, pneumonitis (unless it's the known dyspnoea/breathlessness guideline), kidney/renal toxicity, myocarditis, steroid tapering questions, central line (CVAD) problems, a brand-new undiagnosed lump/cancer, or draining fluid buildups (ascites/pleural/pericardial effusion) — these need lab results and in-person assessment this chat can't provide.

Rules:
1. If the patient's message matches a known guideline (by name or alias), set matchedGuidelineId to its id.
2. Extract every field value you can confidently determine, from this message and the conversation so far. Use null for anything you don't know — never guess a number or yes/no.
3. ALWAYS also try to extract temperatureC, feelsGenerallyUnwell, and hasRigorsOrShivering if mentioned, regardless of which guideline matched.
4. If a REQUIRED field for the matched guideline is still unknown, list it in missingRequiredFields and phrase ONE short, warm followUpQuestion about it (prefer the guideline's own question wording above). Ask about only one missing field at a time.
5. If nothing required is missing (or nothing matched), set followUpQuestion to null.
6. If the message also plausibly mentions a different known guideline, list its id in multipleSymptomsDetected — don't try to grade it this turn.`;
}

function toAnthropicMessages(
  history: ChatMessage[],
  newMessage: string
): Anthropic.MessageParam[] {
  const bounded = history.slice(-MAX_HISTORY_MESSAGES);
  const messages: Anthropic.MessageParam[] = bounded.map((m) => ({
    role: m.role === "patient" ? "user" : "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: newMessage });
  return messages;
}

/**
 * Understands the patient's free text; does not grade anything. Throws on
 * API failure or a malformed tool response — the /api/chat route catches
 * this and falls back to a safe Amber message (see error_failsafe in
 * types/api.ts), never a crash or a silent Green.
 */
export async function callExtraction(
  params: CallExtractionParams
): Promise<ExtractionResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(params),
    messages: toAnthropicMessages(params.conversationHistory, params.message),
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: EXTRACTION_TOOL.name },
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUseBlock) {
    throw new Error("Extraction call did not return a tool_use block");
  }

  return extractionResultSchema.parse(toolUseBlock.input);
}
