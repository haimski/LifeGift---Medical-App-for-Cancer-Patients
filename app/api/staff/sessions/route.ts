import { auth } from "@/lib/auth/staffAuth";
import { listActiveSessions } from "@/lib/db/sessions";
import type { RagGrade, StaffSessionsResponse } from "@/types/api";

const SEVERITY_RANK: Record<RagGrade, number> = { RED: 0, AMBER: 1, GREEN: 2 };

/**
 * Default sort is urgency, not time or name (see the plan's Staff dashboard
 * section): Red first, then Amber, then Green. Within Red/Amber, oldest
 * graded-at first (most overdue for a look); within Green, most recent
 * first (recency, not urgency, since nothing needs reviewing there). Phase 8
 * has no acknowledge concept yet, so "unacknowledged Red first" collapses
 * to just "Red first" for now — Phase 9 adds the acknowledged/unacknowledged
 * split within Red.
 */
function sortByUrgency<T extends { currentGrade: RagGrade; gradedAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const rankDiff = SEVERITY_RANK[a.currentGrade] - SEVERITY_RANK[b.currentGrade];
    if (rankDiff !== 0) return rankDiff;
    return a.currentGrade === "GREEN"
      ? b.gradedAt.localeCompare(a.gradedAt)
      : a.gradedAt.localeCompare(b.gradedAt);
  });
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await listActiveSessions();
    const body: StaffSessionsResponse = { sessions: sortByUrgency(sessions) };
    return Response.json(body);
  } catch (err) {
    console.error("Failed to load staff worklist", err);
    return Response.json({ error: "failed_to_load" }, { status: 500 });
  }
}
