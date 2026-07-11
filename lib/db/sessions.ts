import "server-only";
import { getPrismaClient } from "@/lib/db/prisma";
import { resolveDisplayName } from "@/lib/triage/registry";
import type { PatientContext, RagGrade } from "@/lib/triage/types";
import type { StaffSessionDetail, StaffSessionSummary } from "@/types/api";

interface RecordChatTurnParams {
  sessionId: string;
  patientContext: PatientContext;
  patientMessage: string;
  assistantMessage: string;
  /** Only set when this turn produced a graded (or global-override) result. */
  grade?: RagGrade;
  guidelineId?: string;
  /** Snapshots of EvaluationResult.gradeLabel/description/actionText — see schema.prisma's GradeEvent doc comment. */
  gradeLabel?: string;
  description?: string;
  actionText?: string;
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
  gradeLabel,
  description,
  actionText,
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
    // sync rather than freezing it at first contact. A fresh Red grade also
    // clears any earlier acknowledgment — a stale "acknowledged" from a
    // past incident must never suppress a new emergency (Phase 9).
    update: {
      cancerType: patientContext.cancerType,
      treatmentType: patientContext.treatmentType,
      helplineNumber: patientContext.helplineNumber,
      recentSactWithin6Weeks: patientContext.recentSactWithin6Weeks,
      ...(grade === "RED" ? { acknowledgedAt: null, acknowledgedBy: null } : {}),
    },
  });

  await prisma.message.createMany({
    data: [
      { sessionId, role: "patient", content: patientMessage },
      { sessionId, role: "assistant", content: assistantMessage, grade: grade ?? null },
    ],
  });

  if (grade && guidelineId && gradeLabel !== undefined && description !== undefined && actionText !== undefined) {
    await prisma.gradeEvent.create({
      data: { sessionId, grade, guidelineId, gradeLabel, description, actionText },
    });
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

/**
 * The staff worklist's data source (GET /api/staff/sessions) — one row per
 * session that has been graded at least once. Sessions with no GradeEvent
 * yet (still mid follow-up questions) don't appear, since there's nothing
 * for staff to triage yet. Urgency sorting happens in the route, not here.
 */
export async function listActiveSessions(): Promise<StaffSessionSummary[]> {
  const prisma = getPrismaClient();
  const sessions = await prisma.patientSession.findMany({
    include: { gradeEvents: { orderBy: { createdAt: "asc" } } },
  });

  return sessions
    .filter((session) => session.gradeEvents.length > 0)
    .map((session) => {
      const latest = session.gradeEvents[session.gradeEvents.length - 1];
      return {
        id: session.id,
        patientName: session.patientName,
        cancerType: session.cancerType,
        treatmentType: session.treatmentType,
        currentGrade: latest.grade as RagGrade,
        guidelineId: latest.guidelineId,
        presentingComplaint: resolveDisplayName(latest.guidelineId),
        gradeLabel: latest.gradeLabel,
        gradedAt: latest.createdAt.toISOString(),
        gradeTrend: session.gradeEvents.map((event) => event.grade as RagGrade),
        acknowledgedAt: session.acknowledgedAt?.toISOString() ?? null,
        acknowledgedBy: session.acknowledgedBy,
      };
    });
}

/**
 * The drill-down panel's data source (GET /api/staff/sessions/[id]) — the
 * full read-only transcript plus every graded evaluation's literal
 * matched-criterion text, so staff see the actual UKONS wording behind
 * each grade rather than an opaque judgement. Returns null if no session
 * with this id exists.
 */
export async function getSessionDetail(sessionId: string): Promise<StaffSessionDetail | null> {
  const prisma = getPrismaClient();
  const session = await prisma.patientSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      gradeEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) return null;

  return {
    id: session.id,
    patientName: session.patientName,
    contactNumber: session.contactNumber,
    cancerType: session.cancerType,
    treatmentType: session.treatmentType,
    helplineNumber: session.helplineNumber,
    messages: session.messages.map((message) => ({
      id: message.id,
      role: message.role as "patient" | "assistant",
      content: message.content,
      grade: (message.grade as RagGrade | null) ?? null,
      createdAt: message.createdAt.toISOString(),
    })),
    gradeEvents: session.gradeEvents.map((event) => ({
      id: event.id,
      grade: event.grade as RagGrade,
      guidelineId: event.guidelineId,
      presentingComplaint: resolveDisplayName(event.guidelineId),
      gradeLabel: event.gradeLabel,
      description: event.description,
      actionText: event.actionText,
      createdAt: event.createdAt.toISOString(),
    })),
    acknowledgedAt: session.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: session.acknowledgedBy,
  };
}

/**
 * Marks a session's current Red as handled — clears the alert-bar pulse
 * (Phase 9). acknowledgedBy is free text (v1 has a single shared staff
 * login), optional, purely for a paper-trail. Only ever meaningful for a
 * session that's actually graded Red; acknowledging a Green/Amber session
 * is harmless but has no visible effect since only Red rows show the
 * unacknowledged-pulse styling.
 */
export async function acknowledgeSession(
  sessionId: string,
  acknowledgedBy: string | null
): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.patientSession.update({
    where: { id: sessionId },
    data: { acknowledgedAt: new Date(), acknowledgedBy },
  });
}
