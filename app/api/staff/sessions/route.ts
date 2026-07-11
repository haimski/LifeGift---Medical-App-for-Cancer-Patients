import { auth } from "@/lib/auth/staffAuth";
import { listActiveSessions } from "@/lib/db/sessions";
import type { RagGrade, StaffSessionsResponse } from "@/types/api";

/**
 * Default sort is urgency, not time or name (see the plan's Staff dashboard
 * section): unacknowledged Red first, then acknowledged-but-still-Red, then
 * Amber, then Green. Within Red/Amber, oldest graded-at first (most overdue
 * for a look); within Green, most recent first (recency, not urgency, since
 * nothing needs reviewing there).
 */
function urgencyRank(row: { currentGrade: RagGrade; acknowledgedAt: string | null }): number {
  if (row.currentGrade === "RED") return row.acknowledgedAt ? 1 : 0;
  if (row.currentGrade === "AMBER") return 2;
  return 3;
}

function sortByUrgency<
  T extends { currentGrade: RagGrade; acknowledgedAt: string | null; gradedAt: string },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const rankDiff = urgencyRank(a) - urgencyRank(b);
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
