import { CircleCheck, TriangleAlert, Siren, Thermometer } from "lucide-react";
import type { RagGrade } from "@/types/api";

const NEUTROPENIC_SEPSIS_GUIDELINE_ID = "neutropenic_sepsis_override";

const COLOR_CLASSES: Record<RagGrade, string> = {
  GREEN: "text-rag-green",
  AMBER: "text-rag-amber",
  RED: "text-rag-red",
};

interface GradeIconProps {
  grade: RagGrade;
  /** When this is the neutropenic sepsis override, shows a Thermometer instead of the generic Red icon — see the plan's Graphic language section. */
  guidelineId?: string;
  className?: string;
}

/**
 * Icon + colour together, never colour alone, per the plan's "Graphic
 * language" section — redundant encoding for the staff worklist/alert bar/
 * drill-down. lucide-react (not emoji): this is professional clinical
 * tooling for staff, unlike the patient app's warmer emoji-based tone.
 */
export function GradeIcon({ grade, guidelineId, className }: GradeIconProps) {
  const cls = `${COLOR_CLASSES[grade]} ${className ?? ""}`;

  if (grade === "RED" && guidelineId === NEUTROPENIC_SEPSIS_GUIDELINE_ID) {
    return <Thermometer aria-hidden className={cls} />;
  }
  if (grade === "RED") return <Siren aria-hidden className={cls} />;
  if (grade === "AMBER") return <TriangleAlert aria-hidden className={cls} />;
  return <CircleCheck aria-hidden className={cls} />;
}
