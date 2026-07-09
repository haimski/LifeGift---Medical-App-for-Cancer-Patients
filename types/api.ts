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
      /** A non-symptom message (greeting, thanks, small talk, app questions) — never graded, see lib/llm/conversation.ts. Mirrors follow_up's state-carrying fields (always no-ops here: no questionnaire was in progress for this branch to fire). */
      type: "conversational";
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

/** One row in the staff worklist — GET /api/staff/sessions. */
export interface StaffSessionSummary {
  id: string;
  patientName: string | null;
  cancerType: string;
  treatmentType: string;
  currentGrade: RagGrade;
  /** The matched guideline/override's own id — e.g. distinguishing the neutropenic sepsis override for its distinct icon treatment. */
  guidelineId: string;
  /** Hebrew display name of the matched guideline/override, resolved fresh from the registry (not a historical snapshot). */
  presentingComplaint: string;
  gradeLabel: string;
  gradedAt: string;
  /** Chronological (oldest → newest) grade history for this session's trend indicator. */
  gradeTrend: RagGrade[];
}

export interface StaffSessionsResponse {
  sessions: StaffSessionSummary[];
}

/** A single chat-turn message, as shown in the drill-down transcript. */
export interface StaffTranscriptMessage {
  id: string;
  role: "patient" | "assistant";
  content: string;
  grade: RagGrade | null;
  createdAt: string;
}

/** A single rules-engine evaluation, as shown in the drill-down "why this grade" panel. */
export interface StaffGradeEvent {
  id: string;
  grade: RagGrade;
  guidelineId: string;
  presentingComplaint: string;
  gradeLabel: string;
  description: string;
  actionText: string;
  createdAt: string;
}

/** GET /api/staff/sessions/[id] — the drill-down panel's data. */
export interface StaffSessionDetail {
  id: string;
  patientName: string | null;
  contactNumber: string | null;
  cancerType: string;
  treatmentType: string;
  helplineNumber: string;
  messages: StaffTranscriptMessage[];
  gradeEvents: StaffGradeEvent[];
}
