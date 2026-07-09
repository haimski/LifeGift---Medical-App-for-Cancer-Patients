export function PatientBubble({ content }: { content: string }) {
  return (
    // Pinned physically right regardless of text direction — the common
    // chat convention (WhatsApp, etc.) keeps the user's own messages on the
    // right in both RTL and LTR UIs, rather than letting "end" auto-flip
    // with `dir`. See the plan's Localization/RTL note.
    <div className="flex ltr:justify-end rtl:justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-azure-600 px-4 py-2.5 text-sm text-white">
        {content}
      </div>
    </div>
  );
}
