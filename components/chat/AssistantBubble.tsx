import { GradeBadge } from "@/components/chat/GradeBadge";
import type { RagGrade } from "@/types/api";

interface AssistantBubbleProps {
  content: string;
  grade?: RagGrade;
}

export function AssistantBubble({ content, grade }: AssistantBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[80%] flex-col gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
        {grade && <GradeBadge grade={grade} />}
        <span>{content}</span>
      </div>
    </div>
  );
}
