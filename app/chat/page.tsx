"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { RedFlagInterstitial } from "@/components/chat/RedFlagInterstitial";
import {
  getPatientContext,
  type PatientContext,
} from "@/lib/context/patientContext";
import {
  clearConversation,
  getConversation,
  saveConversation,
  makeMessageId,
} from "@/lib/context/conversationStore";
import type { ChatApiRequest, ChatApiResponse, ChatMessage, PendingFields } from "@/types/api";

const MAX_HISTORY_SENT = 20;
const FAIL_SAFE_MESSAGE =
  "Sorry, something went wrong on our end. To be safe, please contact your 24-hour helpline to discuss your symptoms.";

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

  // Tracks the in-progress complaint across follow-up turns; reset once a
  // turn comes back graded (or fail-safed) so the next message starts a
  // fresh complaint. See app/api/chat/route.ts for how these are used.
  const [activeGuidelineId, setActiveGuidelineId] = useState<string | null>(null);
  const [pendingFields, setPendingFields] = useState<PendingFields>({});
  const [followUpRoundCount, setFollowUpRoundCount] = useState(0);

  // Driven strictly by the API response's own `redFlag` field (computed by
  // the deterministic rules engine) — never by anything parsed from
  // `assistantMessage`. See RedFlagInterstitial's doc comment.
  const [redFlag, setRedFlag] = useState({ show: false, helplineNumber: "" });

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

  async function handleSend(content: string) {
    if (!context) return;

    const patientMessage: ChatMessage = {
      id: makeMessageId(),
      role: "patient",
      content,
      timestamp: new Date().toISOString(),
    };
    const historyForRequest = [...messages, patientMessage].slice(-MAX_HISTORY_SENT);
    setMessages((prev) => [...prev, patientMessage]);
    setIsAssistantTyping(true);

    try {
      const requestBody: ChatApiRequest = {
        patientContext: context,
        conversationHistory: historyForRequest,
        message: content,
        activeGuidelineId,
        pendingFields,
        followUpRoundCount,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data: ChatApiResponse = await res.json();

      const assistantMessage: ChatMessage = {
        id: makeMessageId(),
        role: "assistant",
        content: data.assistantMessage,
        timestamp: new Date().toISOString(),
        grade: data.type !== "follow_up" ? data.grade : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.type === "follow_up") {
        setActiveGuidelineId(data.activeGuidelineId);
        setPendingFields(data.pendingFields);
        setFollowUpRoundCount(data.followUpRoundCount);
      } else {
        // graded or error_failsafe: this complaint is resolved (or we've
        // fail-safed on it) — start fresh for whatever the patient says next.
        setActiveGuidelineId(null);
        setPendingFields({});
        setFollowUpRoundCount(0);
      }

      if (data.type === "graded" && data.redFlag) {
        setRedFlag({ show: true, helplineNumber: data.helplineNumber });
      }
    } catch (err) {
      console.error("Chat request failed", err);
      const fallback: ChatMessage = {
        id: makeMessageId(),
        role: "assistant",
        content: FAIL_SAFE_MESSAGE,
        timestamp: new Date().toISOString(),
        grade: "AMBER",
      };
      setMessages((prev) => [...prev, fallback]);
      setActiveGuidelineId(null);
      setPendingFields({});
      setFollowUpRoundCount(0);
    } finally {
      setIsAssistantTyping(false);
    }
  }

  function handleStartNewConversation() {
    if (!context || messages.length <= 1) return;
    const confirmed = window.confirm(
      "Start a new conversation? This clears your chat history on this device."
    );
    if (!confirmed) return;

    clearConversation();
    setMessages(buildInitialMessages(context.cancerType));
    setActiveGuidelineId(null);
    setPendingFields({});
    setFollowUpRoundCount(0);
    setRedFlag({ show: false, helplineNumber: "" });
  }

  if (!context) return null;

  return (
    <div className="flex flex-1 flex-col">
      {messages.length > 1 && (
        <div className="flex justify-end border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={handleStartNewConversation}
            className="min-h-11 text-xs font-medium text-accent-text underline underline-offset-4"
          >
            Start a new conversation
          </button>
        </div>
      )}
      <MessageList messages={messages} isAssistantTyping={isAssistantTyping} />
      <MessageInput onSend={handleSend} disabled={isAssistantTyping || redFlag.show} />
      <RedFlagInterstitial
        show={redFlag.show}
        helplineNumber={redFlag.helplineNumber}
        onAcknowledge={() => setRedFlag((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
