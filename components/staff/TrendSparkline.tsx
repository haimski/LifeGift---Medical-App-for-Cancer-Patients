import type { RagGrade } from "@/types/api";

const DOT_CLASSES: Record<RagGrade, string> = {
  GREEN: "bg-rag-green",
  AMBER: "bg-rag-amber",
  RED: "bg-rag-red",
};

const MAX_DOTS = 6;

interface TrendSparklineProps {
  /** Chronological (oldest → newest) grade history for one session. */
  gradeTrend: RagGrade[];
}

/**
 * A compact Green→Amber→Red history, oldest to newest (left to right,
 * logical order so it reads correctly under RTL too) — so a patient
 * climbing toward Red is visually flagged even before they arrive there,
 * per the plan's Staff dashboard row-anatomy section. Deliberately plain
 * dots rather than a charting library: the dashboard's dependency budget is
 * just lucide-react + framer-motion.
 */
export function TrendSparkline({ gradeTrend }: TrendSparklineProps) {
  const recent = gradeTrend.slice(-MAX_DOTS);
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {recent.map((grade, index) => (
        <span
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[grade]}`}
        />
      ))}
    </div>
  );
}
