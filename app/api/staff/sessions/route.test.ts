import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/auth/staffAuth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db/sessions", () => ({
  listActiveSessions: vi.fn(),
}));

import type { Session } from "next-auth";
import { auth } from "@/lib/auth/staffAuth";
import { listActiveSessions } from "@/lib/db/sessions";
import type { StaffSessionSummary, StaffSessionsResponse } from "@/types/api";
import { GET } from "@/app/api/staff/sessions/route";

// `auth` is overloaded (route-handler-wrapping, middleware-wrapping, and
// plain no-args session lookup) — vi.mocked() infers the last overload by
// default, so this narrows to the one signature the route actually calls.
const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>);
const mockedListActiveSessions = vi.mocked(listActiveSessions);

const FAKE_SESSION: Session = { expires: new Date(Date.now() + 3_600_000).toISOString() };

function makeSession(overrides: Partial<StaffSessionSummary>): StaffSessionSummary {
  return {
    id: "session-1",
    patientName: null,
    cancerType: "Breast",
    treatmentType: "chemotherapy_sact",
    currentGrade: "GREEN",
    guidelineId: "vomiting",
    presentingComplaint: "הקאות",
    gradeLabel: "דרגה 1 (ירוק)",
    gradedAt: new Date().toISOString(),
    gradeTrend: ["GREEN"],
    acknowledgedAt: null,
    acknowledgedBy: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/staff/sessions", () => {
  it("returns 401 without a staff session", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(mockedListActiveSessions).not.toHaveBeenCalled();
  });

  it("sorts Red first, then Amber, then Green, oldest-first within Red/Amber and newest-first within Green", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    const older = new Date(Date.now() - 60_000).toISOString();
    const newer = new Date().toISOString();

    mockedListActiveSessions.mockResolvedValue([
      makeSession({ id: "green-old", currentGrade: "GREEN", gradedAt: older }),
      makeSession({ id: "green-new", currentGrade: "GREEN", gradedAt: newer }),
      makeSession({ id: "amber-new", currentGrade: "AMBER", gradedAt: newer }),
      makeSession({ id: "amber-old", currentGrade: "AMBER", gradedAt: older }),
      makeSession({ id: "red-new", currentGrade: "RED", gradedAt: newer }),
      makeSession({ id: "red-old", currentGrade: "RED", gradedAt: older }),
    ]);

    const res = await GET();
    const body = (await res.json()) as StaffSessionsResponse;

    expect(body.sessions.map((s) => s.id)).toEqual([
      "red-old",
      "red-new",
      "amber-old",
      "amber-new",
      "green-new",
      "green-old",
    ]);
  });

  it("returns 500 (not a crash) if the DB query fails", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    mockedListActiveSessions.mockRejectedValue(new Error("connection refused"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
