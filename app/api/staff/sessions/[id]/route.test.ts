import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/auth/staffAuth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db/sessions", () => ({
  getSessionDetail: vi.fn(),
}));

import type { Session } from "next-auth";
import { auth } from "@/lib/auth/staffAuth";
import { getSessionDetail } from "@/lib/db/sessions";
import type { StaffSessionDetail } from "@/types/api";
import { GET } from "@/app/api/staff/sessions/[id]/route";

// See the sibling route.test.ts for why this cast is needed — `auth` is
// overloaded and vi.mocked() otherwise infers the wrong signature.
const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>);
const mockedGetSessionDetail = vi.mocked(getSessionDetail);

const FAKE_SESSION: Session = { expires: new Date(Date.now() + 3_600_000).toISOString() };

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/staff/sessions/[id]", () => {
  it("returns 401 without a staff session", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/staff/sessions/abc"), makeParams("abc"));

    expect(res.status).toBe(401);
    expect(mockedGetSessionDetail).not.toHaveBeenCalled();
  });

  it("returns 404 when the session doesn't exist", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    mockedGetSessionDetail.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/staff/sessions/missing"), makeParams("missing"));

    expect(res.status).toBe(404);
  });

  it("returns the session detail when found", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    const detail: StaffSessionDetail = {
      id: "abc",
      patientName: null,
      contactNumber: null,
      cancerType: "Lung",
      treatmentType: "chemotherapy_sact",
      helplineNumber: "03-1234567",
      messages: [],
      gradeEvents: [],
      acknowledgedAt: null,
      acknowledgedBy: null,
    };
    mockedGetSessionDetail.mockResolvedValue(detail);

    const res = await GET(new Request("http://localhost/api/staff/sessions/abc"), makeParams("abc"));
    const body = (await res.json()) as StaffSessionDetail;

    expect(res.status).toBe(200);
    expect(body.id).toBe("abc");
  });
});
