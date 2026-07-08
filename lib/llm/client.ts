import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Server-only singleton — never import this from a Client Component. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Cheap/fast model for structured extraction; a stronger model for the
// warmer patient-facing phrasing step. Both overridable via env vars
// without touching code.
export const EXTRACTION_MODEL =
  process.env.LIFEGIFT_EXTRACTION_MODEL ?? "claude-haiku-4-5-20251001";
export const PHRASING_MODEL =
  process.env.LIFEGIFT_PHRASING_MODEL ?? "claude-sonnet-5";
