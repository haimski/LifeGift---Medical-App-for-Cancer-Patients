import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/api";
import { PatientBubble } from "@/components/chat/PatientBubble";
import { AssistantBubble } from "@/components/chat/AssistantBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface MessageListProps {
  messages: ChatMessage[];
  isAssistantTyping: boolean;
}

export function MessageList({ messages, isAssistantTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAssistantTyping]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((message) =>
        message.role === "patient" ? (
          <PatientBubble key={message.id} content={message.content} />
        ) : (
          <AssistantBubble
            key={message.id}
            content={message.content}
            grade={message.grade}
          />
        )
      )}
      {isAssistantTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
