"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { IdentifyPrompt } from "@/components/chat/IdentifyPrompt";
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
import { getOrCreateSessionId } from "@/lib/context/sessionId";
import {
  hasBeenAskedToIdentify,
  markAskedToIdentify,
} from "@/lib/context/identification";
import type { ChatApiRequest, ChatApiResponse, ChatMessage, PendingFields } from "@/types/api";

const MAX_HISTORY_SENT = 20;

function buildInitialMessages(
  cancerType: string,
  greeting: string
): ChatMessage[] {
  const existing = getConversation();
  if (existing.length > 0) return existing;
  return [
    {
      id: makeMessageId(),
      role: "assistant",
      content: greeting,
      timestamp: new Date().toISOString(),
    },
  ];
}

export default function ChatPage() {
  const router = useRouter();
  const t = useTranslations("chat");
  // Stays null until the post-mount effect below resolves it — matches the
  // build-time static server output (no `window`), so first paint never
  // hydration-mismatches. See the same pattern/comment in
  // app/onboarding/helpline/page.tsx.
  const [context, setContext] = useState<PatientContext | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  // Progressive identification (Phase 7): the prompt is shown at most once
  // per session (persisted in localStorage, so it survives a page reload —
  // see lib/context/identification.ts) — the first time a turn grades
  // Amber or Red. Shown immediately once a grade lands; there's no
  // separate emergency interstitial to sequence around.
  const [hasIdentified, setHasIdentified] = useState(false);
  const [showIdentifyPrompt, setShowIdentifyPrompt] = useState(false);

  // Tracks the in-progress complaint across follow-up turns; reset once a
  // turn comes back graded (or fail-safed) so the next message starts a
  // fresh complaint. See app/api/chat/route.ts for how these are used.
  const [activeGuidelineId, setActiveGuidelineId] = useState<string | null>(null);
  const [pendingFields, setPendingFields] = useState<PendingFields>({});
  const [followUpRoundCount, setFollowUpRoundCount] = useState(0);

  // Other guideline ids the patient mentioned alongside the current
  // complaint, still waiting to be addressed — see route.ts's
  // bridgeToNextQueued and the plan's "Multi-symptom investigation".
  const [pendingGuidelineQueue, setPendingGuidelineQueue] = useState<string[]>([]);
  // Client-side only, never sent to the server: whether the once-per-
  // session safety-net question has already been shown.
  const [hasShownSafetyNet, setHasShownSafetyNet] = useState(false);

  useEffect(() => {
    const ctx = getPatientContext();
    if (!ctx) {
      router.replace("/onboarding");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: see comment above
    setContext(ctx);
    setSessionId(getOrCreateSessionId());
    setHasIdentified(hasBeenAskedToIdentify());
    setMessages(
      buildInitialMessages(ctx.cancerType, t("greeting", { cancerType: ctx.cancerType }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable for the single active locale; re-running on every render would refetch buildInitialMessages needlessly
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
        sessionId,
        patientContext: context,
        conversationHistory: historyForRequest,
        message: content,
        activeGuidelineId,
        pendingFields,
        followUpRoundCount,
        pendingGuidelineQueue,
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
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.type === "follow_up") {
        // Covers both "still gathering fields for a matched guideline" and
        // "just natural conversation, nothing symptom-related yet" — see
        // route.ts's resolvedGuidelineId-null branch. Either way this is a
        // no-op state sync when nothing's actually in progress.
        setActiveGuidelineId(data.activeGuidelineId);
        setPendingFields(data.pendingFields);
        setFollowUpRoundCount(data.followUpRoundCount);
        setPendingGuidelineQueue(data.pendingGuidelineQueue);
      } else if (data.type === "graded") {
        // Bridging into a queued co-mentioned guideline reuses the same
        // follow_up-style state (activeGuidelineId set, fields empty) so
        // the next patient message is understood in that context, without
        // needing a fresh extraction call just to re-identify it.
        setActiveGuidelineId(data.nextActiveGuidelineId);
        setPendingFields({});
        setFollowUpRoundCount(0);
        setPendingGuidelineQueue(data.pendingGuidelineQueue);

        if ((data.grade === "AMBER" || data.grade === "RED") && !hasIdentified) {
          markAskedToIdentify();
          setHasIdentified(true);
          setShowIdentifyPrompt(true);
        }
        if (
          data.grade !== "RED" &&
          data.pendingGuidelineQueue.length === 0 &&
          !data.nextActiveGuidelineId &&
          !hasShownSafetyNet
        ) {
          // Once-per-session safety net (client-side only, never sent to
          // the server) — asked only once nothing is queued and this is
          // the first Green/Amber grade this session, never after Red (an
          // emergency instruction shouldn't be immediately followed by a
          // generic "anything else?" check-in).
          setHasShownSafetyNet(true);
          const safetyNetMessage: ChatMessage = {
            id: makeMessageId(),
            role: "assistant",
            content: t("safetyNetMessage"),
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, safetyNetMessage]);
        }
      } else {
        // error_failsafe: fail-safed on this complaint — start fresh for
        // whatever the patient says next.
        setActiveGuidelineId(null);
        setPendingFields({});
        setFollowUpRoundCount(0);
        setPendingGuidelineQueue([]);
      }
    } catch (err) {
      console.error("Chat request failed", err);
      const fallback: ChatMessage = {
        id: makeMessageId(),
        role: "assistant",
        content: t("failSafeMessage"),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallback]);
      setActiveGuidelineId(null);
      setPendingFields({});
      setFollowUpRoundCount(0);
      setPendingGuidelineQueue([]);
    } finally {
      setIsAssistantTyping(false);
    }
  }

  function handleStartNewConversation() {
    if (!context || messages.length <= 1) return;
    const confirmed = window.confirm(t("startNewConversationConfirm"));
    if (!confirmed) return;

    clearConversation();
    setMessages(
      buildInitialMessages(context.cancerType, t("greeting", { cancerType: context.cancerType }))
    );
    setActiveGuidelineId(null);
    setPendingFields({});
    setFollowUpRoundCount(0);
    setPendingGuidelineQueue([]);
    setHasShownSafetyNet(false);
    // Clears any in-flight identify UI, but deliberately leaves
    // `hasIdentified` alone — it's scoped to the whole anonymous session
    // (persisted in localStorage), not just this visible transcript, so
    // starting a new conversation shouldn't re-ask.
    setShowIdentifyPrompt(false);
  }

  async function handleIdentifySubmit(name: string, contactNumber: string) {
    setShowIdentifyPrompt(false);
    try {
      await fetch("/api/patient-session/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, patientName: name, contactNumber }),
      });
    } catch (err) {
      console.error("Failed to save identification", err);
    }
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
            {t("startNewConversation")}
          </button>
        </div>
      )}
      <MessageList messages={messages} isAssistantTyping={isAssistantTyping} />
      {showIdentifyPrompt && (
        <IdentifyPrompt
          onSubmit={handleIdentifySubmit}
          onSkip={() => setShowIdentifyPrompt(false)}
        />
      )}
      <MessageInput onSend={handleSend} disabled={isAssistantTyping} />
    </div>
  );
}
