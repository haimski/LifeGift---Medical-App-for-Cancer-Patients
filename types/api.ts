import type { PatientContext } from "@/lib/context/patientContext";

export type RagGrade = "GREEN" | "AMBER" | "RED";

export interface ChatMessage {
  id: string;
  role: "patient" | "assistant";
  content: string;
  timestamp: string;
  grade?: RagGrade;
}

/** Fields extracted from patient free text, keyed by ScreeningField id. */
export type PendingFields = Record<string, string | number | boolean | null>;

/** Other guideline ids mentioned alongside the current complaint, still waiting to be addressed. */
export type PendingGuidelineQueue = string[];

export interface ChatApiRequest {
  /** UUID held in the patient's localStorage (see lib/context/sessionId.ts) — identifies the PatientSession row this turn persists to, not a login. */
  sessionId: string;
  patientContext: PatientContext;
  /** Bounded recent history — the client truncates before sending, see conversationStore.ts. */
  conversationHistory: ChatMessage[];
  message: string;
  activeGuidelineId: string | null;
  pendingFields: PendingFields;
  /** How many follow_up turns have already happened for the current complaint. */
  followUpRoundCount: number;
  pendingGuidelineQueue: PendingGuidelineQueue;
}

export type ChatApiResponse =
  | {
      type: "follow_up";
      assistantMessage: string;
      activeGuidelineId: string | null;
      pendingFields: PendingFields;
      followUpRoundCount: number;
      pendingGuidelineQueue: PendingGuidelineQueue;
    }
  | {
      type: "graded";
      assistantMessage: string;
      grade: RagGrade;
      guidelineId: string;
      actionSummary: string;
      redFlag: boolean;
      helplineNumber: string;
      /** Set when bridging into a queued co-mentioned guideline that needs a follow-up question — the client should treat this as activeGuidelineId (with empty pendingFields) on the next turn instead of starting fresh. */
      nextActiveGuidelineId: string | null;
      pendingGuidelineQueue: PendingGuidelineQueue;
    }
  | {
      type: "error_failsafe";
      assistantMessage: string;
      grade: RagGrade;
      redFlag: boolean;
    };
