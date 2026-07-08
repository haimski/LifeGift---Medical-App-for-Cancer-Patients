"use client";

import { useState, type FormEvent } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-border bg-surface px-3 py-3"
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder="Tell us what's going on..."
        className="min-h-11 flex-1 resize-none rounded-xl border border-azure-200 bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-azure-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-azure-600 text-white transition-colors hover:bg-azure-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Send message"
      >
        <span aria-hidden>➤</span>
      </button>
    </form>
  );
}
