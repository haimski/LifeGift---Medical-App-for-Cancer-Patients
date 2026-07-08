export function PatientBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-azure-600 px-4 py-2.5 text-sm text-white">
        {content}
      </div>
    </div>
  );
}
