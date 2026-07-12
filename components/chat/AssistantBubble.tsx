interface AssistantBubbleProps {
  content: string;
}

export function AssistantBubble({ content }: AssistantBubbleProps) {
  return (
    // Pinned physically left regardless of text direction — mirrors
    // PatientBubble's pinning; see its comment.
    <div className="flex ltr:justify-start rtl:justify-end">
      <div className="flex max-w-[80%] flex-col gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
        <span>{content}</span>
      </div>
    </div>
  );
}
