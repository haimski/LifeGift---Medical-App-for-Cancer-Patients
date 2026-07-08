"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import {
  getPatientContext,
  type PatientContext,
} from "@/lib/context/patientContext";
import {
  getConversation,
  saveConversation,
  makeMessageId,
} from "@/lib/context/conversationStore";
import type { ChatMessage } from "@/types/api";

/**
 * Phase 1 canned responses — purely to validate bubble styling and mobile
 * layout before the real extraction/engine/phrasing pipeline (Phase 2/3)
 * exists. Not real triage advice.
 */
const CANNED_RESPONSES: Omit<ChatMessage, "id" | "timestamp" | "role">[] = [
  {
    content:
      "Thanks for letting me know. This is a placeholder response while the real symptom-checking engine is still being built.",
  },
  {
    content:
      "In a future version, this reply will come from the UKONS-based rules engine, phrased for you — for now it's just demonstrating the chat layout.",
    grade: "GREEN",
  },
  {
    content:
      "Here's an example of what an Amber result will look like once it's wired up.",
    grade: "AMBER",
  },
];

function buildInitialMessages(cancerType: string): ChatMessage[] {
  const existing = getConversation();
  if (existing.length > 0) return existing;
  return [
    {
      id: makeMessageId(),
      role: "assistant",
      content: `Hi! I can see you're being treated for ${cancerType.toLowerCase()} cancer. Tell me what's going on and I'll help you figure out the next step.`,
      timestamp: new Date().toISOString(),
    },
  ];
}

export default function ChatPage() {
  const router = useRouter();
  // Stays null until the post-mount effect below resolves it — matches the
  // build-time static server output (no `window`), so first paint never
  // hydration-mismatches. See the same pattern/comment in
  // app/onboarding/helpline/page.tsx.
  const [context, setContext] = useState<PatientContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [cannedIndex, setCannedIndex] = useState(0);

  useEffect(() => {
    const ctx = getPatientContext();
    if (!ctx) {
      router.replace("/onboarding");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: see comment above
    setContext(ctx);
    setMessages(buildInitialMessages(ctx.cancerType));
  }, [router]);

  useEffect(() => {
    if (context) saveConversation(messages);
  }, [context, messages]);

  function handleSend(content: string) {
    const patientMessage: ChatMessage = {
      id: makeMessageId(),
      role: "patient",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, patientMessage]);
    setIsAssistantTyping(true);

    // Canned delay to demonstrate the typing indicator; replaced by a real
    // /api/chat call in Phase 3.
    setTimeout(() => {
      const canned = CANNED_RESPONSES[cannedIndex % CANNED_RESPONSES.length];
      const assistantMessage: ChatMessage = {
        id: makeMessageId(),
        role: "assistant",
        timestamp: new Date().toISOString(),
        ...canned,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsAssistantTyping(false);
      setCannedIndex((i) => i + 1);
    }, 900);
  }

  if (!context) return null;

  return (
    <div className="flex flex-1 flex-col">
      <MessageList messages={messages} isAssistantTyping={isAssistantTyping} />
      <MessageInput onSend={handleSend} disabled={isAssistantTyping} />
    </div>
  );
}
