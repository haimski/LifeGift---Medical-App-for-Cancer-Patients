import { useTranslations } from "next-intl";
import type { RagGrade } from "@/types/api";

const STYLES: Record<RagGrade, string> = {
  GREEN: "bg-rag-green-bg text-rag-green-strong",
  AMBER: "bg-rag-amber-bg text-rag-amber-strong",
  RED: "bg-rag-red-bg text-rag-red-badge-text",
};

const LABEL_KEYS: Record<RagGrade, string> = {
  GREEN: "green",
  AMBER: "amber",
  RED: "red",
};

export function GradeBadge({ grade }: { grade: RagGrade }) {
  const t = useTranslations("gradeBadge");
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[grade]}`}
    >
      {t(LABEL_KEYS[grade])}
    </span>
  );
}
