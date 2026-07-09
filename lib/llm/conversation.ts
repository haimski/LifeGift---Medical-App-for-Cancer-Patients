import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { PHRASING_MODEL, getAnthropicClient } from "@/lib/llm/client";
import { conversationalResultSchema, type ConversationalResult } from "@/lib/llm/schemas";
import type { PatientContext } from "@/lib/triage/types";
import type { ChatMessage } from "@/types/api";

const MAX_HISTORY_MESSAGES = 10;

const CONVERSATION_TOOL: Anthropic.Tool = {
  name: "reply_conversationally",
  description: "Return a warm, caring conversational reply to a non-symptom message.",
  input_schema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The warm, brief, Hebrew conversational reply.",
      },
    },
    required: ["message"],
  },
};

function buildSystemPrompt(patientContext: PatientContext): string {
  return `You are LifeGift's warm, caring, understanding conversational voice. A separate step has already confirmed this particular patient message is NOT a symptom report, so your only job is to respond like a kind, attentive companion would in an ordinary conversation — not to grade, diagnose, or triage anything.

Patient context: cancer type ${patientContext.cancerType}, currently on ${patientContext.treatmentType}.

Guidelines:
- Keep it brief, warm, and natural — a sentence or two, not a lecture.
- If they greet you, greet back warmly. If they thank you, accept it warmly. If they express fear, worry, sadness, or frustration, acknowledge those feelings with empathy before anything else.
- If they ask what this app is/does, answer honestly and briefly: it helps them check in about physical symptoms during cancer treatment, using the same guidance their 24-hour oncology helpline uses — but it isn't a doctor and can't diagnose, and anything urgent should always go to their care team or 999.
- If they ask something clearly unrelated to their care (general knowledge, jokes, unrelated tasks), gently decline and redirect — briefly and kindly steer back to asking how they're feeling or whether anything physical is bothering them, rather than fully engaging with the off-topic request.
- Never give clinical/medical advice, never diagnose, never suggest a severity or urgency level, never claim any test/lab result — that is never your job here.
- Always respond in Hebrew, regardless of what language the patient wrote in.

Call the reply_conversationally tool with your message.`;
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
 * Produces a warm, non-clinical reply for a message the extraction step has
 * already determined mentions no physical symptom at all (see route.ts's
 * `mentionsPhysicalSymptom` branch). Never touches the rules engine and
 * never produces a grade — this call has zero say over triage severity, so
 * it cannot weaken the "LLM is never the sole authority on urgency"
 * invariant. Throws on API failure; callers should fall back to a short
 * static gentle line rather than the clinical fail-safe message, since
 * nothing concerning is actually happening on this path.
 */
export async function callConversationalReply(
  message: string,
  conversationHistory: ChatMessage[],
  patientContext: PatientContext
): Promise<ConversationalResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: PHRASING_MODEL,
    max_tokens: 300,
    system: buildSystemPrompt(patientContext),
    messages: toAnthropicMessages(conversationHistory, message),
    tools: [CONVERSATION_TOOL],
    tool_choice: { type: "tool", name: CONVERSATION_TOOL.name },
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUseBlock) {
    throw new Error("Conversational reply call did not return a tool_use block");
  }

  return conversationalResultSchema.parse(toolUseBlock.input);
}
