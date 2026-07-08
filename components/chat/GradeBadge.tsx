import type { RagGrade } from "@/types/api";

const STYLES: Record<RagGrade, string> = {
  GREEN: "bg-rag-green-bg text-rag-green",
  AMBER: "bg-rag-amber-bg text-rag-amber",
  RED: "bg-rag-red-bg text-rag-red-strong",
};

const LABELS: Record<RagGrade, string> = {
  GREEN: "Green — no cause for concern",
  AMBER: "Amber — contact your team",
  RED: "Red — urgent",
};

export function GradeBadge({ grade }: { grade: RagGrade }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[grade]}`}
    >
      {LABELS[grade]}
    </span>
  );
}
