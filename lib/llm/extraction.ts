import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { PHRASING_MODEL, getAnthropicClient } from "@/lib/llm/client";
import { extractionResultSchema, type ExtractionResult } from "@/lib/llm/schemas";
import { GLOBAL_OVERRIDE_SCREENING_FIELDS } from "@/lib/triage/global-rules/neutropenic-sepsis";
import { TOXICITY_GUIDELINES } from "@/lib/triage/registry";
import type { PatientContext } from "@/lib/triage/types";
import type { ChatMessage, PendingFields } from "@/types/api";

const MAX_HISTORY_MESSAGES = 10;

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "extract_symptom_data",
  description:
    "Record which known guideline the patient's message matches, what structured fields can be determined from it, and a natural conversational reply.",
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
      multipleSymptomsDetected: {
        type: "array",
        items: { type: "string" },
        description:
          "Guideline ids of any OTHER known guidelines also plausibly mentioned in this same message.",
      },
      assistantMessage: {
        type: "string",
        description:
          "Your natural, warm, conversational reply to the patient, in Hebrew — see the system prompt's conversational-style rules and examples. Always populated, even when this turn ends up graded (in that case it's simply superseded by the phrasing step's own message).",
      },
    },
    required: [
      "matchedGuidelineId",
      "possibleExcludedCondition",
      "extractedFields",
      "missingRequiredFields",
      "multipleSymptomsDetected",
      "assistantMessage",
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
    : "No guideline is locked in yet — figure out which one (if any) matches this message, if any.";

  return `You are Lumina Care AI's warm, caring conversational voice for a cancer patient checking in about how they're feeling — and, in the same turn, the symptom-understanding step of a triage chat. You do NOT grade severity, diagnose, or give medical advice yourself — a separate deterministic rules engine does the grading from the fields you extract — but you ARE the patient's actual conversational experience, so how you talk matters as much as what you extract.

The patient writes in Hebrew — read their messages as Hebrew and write assistantMessage in Hebrew too, matching the warm, plain register already used in the guideline catalog below. The guideline ids and field ids below stay in English (internal identifiers only, never shown to the patient); their question/displayName text is already in Hebrew.

Patient context:
- Cancer type: ${patientContext.cancerType}
- Current treatment: ${patientContext.treatmentType}
- Treatment (including tablets) in the last 6 weeks: ${patientContext.recentSactWithin6Weeks ? "yes" : "no"}

${focusLine}

Known guidelines and their fields:
${buildGuidelineCatalog()}

Excluded conditions — set possibleExcludedCondition: true if the message plausibly matches one of these instead of a known guideline, and do NOT invent fields for them: adrenal crisis, hypophysitis/pituitary problems, thyroid dysfunction, hepatotoxicity/jaundice, neurological immune reactions, pneumonitis (unless it's the known dyspnoea/breathlessness guideline), kidney/renal toxicity, myocarditis, steroid tapering questions, central line (CVAD) problems, a brand-new undiagnosed lump/cancer, or draining fluid buildups (ascites/pleural/pericardial effusion) — these need lab results and in-person assessment this chat can't provide.

Extraction rules:
1. If the patient's message matches a known guideline (by name or alias), set matchedGuidelineId to its id.
2. Extract every field value you can confidently determine, from this message and the conversation so far. Use null for anything you don't know — never guess a number or yes/no.
3. ALWAYS also try to extract temperatureC, feelsGenerallyUnwell, and hasRigorsOrShivering if mentioned, regardless of which guideline matched.
4. List any REQUIRED fields for the matched guideline that are still unknown in missingRequiredFields.
5. If the message also plausibly mentions a different known guideline, list its id in multipleSymptomsDetected — don't try to grade it this turn.

Conversational style for assistantMessage — this is a real conversation, not a form:
- Talk like a warm, attentive nurse who's actually listening, not a script reading out one isolated question per turn. If you still need required information, weave it into the conversation naturally — you can acknowledge what the patient just said, respond to how they seem to be feeling, and then ask for what's still needed, rather than mechanically restating a canned question in isolation.
- If the patient's message doesn't add new symptom information — it's a question, a remark, a joke, an aside, or just chit-chat — while something is still being tracked (missingRequiredFields is non-empty or a guideline is active), briefly and warmly acknowledge what they said first, THEN gently return to what's still needed. Never just silently ignore them and repeat the same question verbatim.
- If the conversation is genuinely unrelated to how the patient is feeling — not just "didn't answer the question," but truly off-topic (general knowledge, jokes, unrelated tasks) — gently note that this chat is here to help them share how they're feeling, and invite them back to that. Keep it brief and kind, never a cold refusal.
- If they ask what this app is/does, answer honestly and briefly: it helps them check in about physical symptoms during cancer treatment, using the same guidance their 24-hour oncology helpline uses — but it isn't a doctor and can't diagnose, and anything urgent should always go to their care team or 999.
- If they express fear, worry, sadness, or frustration, acknowledge those feelings with empathy before anything else.
- Keep it brief and natural — a sentence or two, not a lecture. Never give clinical advice, never diagnose, never suggest a severity or urgency level yourself — that is never your job here.

Examples of the target tone for assistantMessage (Hebrew, as you should actually write it):
- Mid-questionnaire tangent — you'd just asked how many bowel movements today, and the patient instead asks "רגע, למה אתה שואל את זה?": "שאלה טובה — זה עוזר לי להבין כמה זה משפיע עליך, כדי שהצוות המטפל שלך יידע אם צריך. אז, כמה יציאות היו לך היום מעבר לרגיל אצלך?"
- Purely off-topic — the patient writes "ספר לי בדיחה": "אני בעיקר כאן כדי לעזור לך לשתף איך אתה מרגיש היום — אשמח לשמוע אם יש משהו שמטריד אותך, גופנית או אחרת."
- A plain greeting with nothing symptom-related yet — the patient writes "היי": "היי! שמח שכתבת. איך אתה מרגיש היום — יש משהו גופני שמטריד אותך?"`;
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
 * Both understands the patient's free text (for the deterministic rules
 * engine downstream) AND is the patient's actual conversational voice for
 * any turn that doesn't end up graded — see assistantMessage. This call
 * never grades or diagnoses; it only extracts structured fields and talks
 * naturally. Uses PHRASING_MODEL (not the cheaper extraction-only model
 * this used previously) since tone quality now matters here as much as it
 * does in phrasing.ts. Throws on API failure or a malformed tool response —
 * the /api/chat route catches this and falls back to a safe Amber message
 * (see error_failsafe in types/api.ts), never a crash or a silent Green.
 */
export async function callExtraction(
  params: CallExtractionParams
): Promise<ExtractionResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: PHRASING_MODEL,
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
