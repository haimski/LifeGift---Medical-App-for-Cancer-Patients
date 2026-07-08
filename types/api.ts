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

export interface ChatApiRequest {
  patientContext: PatientContext;
  /** Bounded recent history — the client truncates before sending, see conversationStore.ts. */
  conversationHistory: ChatMessage[];
  message: string;
  activeGuidelineId: string | null;
  pendingFields: PendingFields;
  /** How many follow_up turns have already happened for the current complaint. */
  followUpRoundCount: number;
}

export type ChatApiResponse =
  | {
      type: "follow_up";
      assistantMessage: string;
      activeGuidelineId: string | null;
      pendingFields: PendingFields;
      followUpRoundCount: number;
    }
  | {
      type: "graded";
      assistantMessage: string;
      grade: RagGrade;
      guidelineId: string;
      actionSummary: string;
      redFlag: boolean;
      helplineNumber: string;
    }
  | {
      type: "error_failsafe";
      assistantMessage: string;
      grade: RagGrade;
      redFlag: boolean;
    };
