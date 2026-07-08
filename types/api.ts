export type RagGrade = "GREEN" | "AMBER" | "RED";

export interface ChatMessage {
  id: string;
  role: "patient" | "assistant";
  content: string;
  timestamp: string;
  grade?: RagGrade;
}
