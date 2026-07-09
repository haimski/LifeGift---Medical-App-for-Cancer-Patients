import "server-only";
import { getPrismaClient } from "@/lib/db/prisma";
import type { PatientContext, RagGrade } from "@/lib/triage/types";

interface RecordChatTurnParams {
  sessionId: string;
  patientContext: PatientContext;
  patientMessage: string;
  assistantMessage: string;
  /** Only set when this turn produced a graded (or global-override) result. */
  grade?: RagGrade;
  guidelineId?: string;
}

/**
 * Persists one chat turn: upserts the PatientSession row (creating it on
 * this session's first contact), records both messages, and — when this
 * turn graded — records a GradeEvent for the staff dashboard's trend
 * indicator (Phase 8+). Callers must treat this as best-effort: a DB outage
 * must never break or delay the patient-facing chat response, so this is
 * always called after the response body is already computed, wrapped in a
 * try/catch that only logs. See app/api/chat/route.ts.
 */
export async function recordChatTurn({
  sessionId,
  patientContext,
  patientMessage,
  assistantMessage,
  grade,
  guidelineId,
}: RecordChatTurnParams): Promise<void> {
  const prisma = getPrismaClient();

  await prisma.patientSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      cancerType: patientContext.cancerType,
      treatmentType: patientContext.treatmentType,
      helplineNumber: patientContext.helplineNumber,
      recentSactWithin6Weeks: patientContext.recentSactWithin6Weeks,
    },
    // Patient context could in principle change between turns (e.g. the
    // patient goes back and edits an onboarding answer) — keep the row in
    // sync rather than freezing it at first contact.
    update: {
      cancerType: patientContext.cancerType,
      treatmentType: patientContext.treatmentType,
      helplineNumber: patientContext.helplineNumber,
      recentSactWithin6Weeks: patientContext.recentSactWithin6Weeks,
    },
  });

  await prisma.message.createMany({
    data: [
      { sessionId, role: "patient", content: patientMessage },
      { sessionId, role: "assistant", content: assistantMessage, grade: grade ?? null },
    ],
  });

  if (grade && guidelineId) {
    await prisma.gradeEvent.create({ data: { sessionId, grade, guidelineId } });
  }
}

/**
 * Writes the progressive-identification prompt's answer to an existing
 * session. Only ever called after at least one graded turn (which already
 * upserted the row via recordChatTurn above), so the row is guaranteed to
 * exist. See components/chat/IdentifyPrompt.tsx and the plan's Onboarding
 * section — this never gates or delays the patient's own emergency guidance.
 */
export async function identifyPatientSession(
  sessionId: string,
  identity: { patientName: string; contactNumber: string }
): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.patientSession.update({
    where: { id: sessionId },
    data: { patientName: identity.patientName, contactNumber: identity.contactNumber },
  });
}
