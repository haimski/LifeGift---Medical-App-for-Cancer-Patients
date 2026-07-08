import type { ChatMessage } from "@/types/api";

const CONVERSATION_KEY = "lifegift:conversation";

export function getConversation(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATION_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveConversation(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages));
}

export function makeMessageId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
