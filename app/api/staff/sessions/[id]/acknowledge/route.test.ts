import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/auth/staffAuth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db/sessions", () => ({
  acknowledgeSession: vi.fn(),
}));

import type { Session } from "next-auth";
import { auth } from "@/lib/auth/staffAuth";
import { acknowledgeSession } from "@/lib/db/sessions";
import { POST } from "@/app/api/staff/sessions/[id]/acknowledge/route";

// See the sibling route.test.ts files for why this cast is needed — `auth`
// is overloaded and vi.mocked() otherwise infers the wrong signature.
const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>);
const mockedAcknowledgeSession = vi.mocked(acknowledgeSession);

const FAKE_SESSION: Session = { expires: new Date(Date.now() + 3_600_000).toISOString() };

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/staff/sessions/abc/acknowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/staff/sessions/[id]/acknowledge", () => {
  it("returns 401 without a staff session", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({}), makeParams("abc"));

    expect(res.status).toBe(401);
    expect(mockedAcknowledgeSession).not.toHaveBeenCalled();
  });

  it("acknowledges with a null acknowledgedBy when the body omits it", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    mockedAcknowledgeSession.mockResolvedValue(undefined);

    const res = await POST(makeRequest({}), makeParams("abc"));

    expect(res.status).toBe(200);
    expect(mockedAcknowledgeSession).toHaveBeenCalledWith("abc", null);
  });

  it("acknowledges with the provided acknowledgedBy", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    mockedAcknowledgeSession.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ acknowledgedBy: "Nurse Dana" }), makeParams("abc"));

    expect(res.status).toBe(200);
    expect(mockedAcknowledgeSession).toHaveBeenCalledWith("abc", "Nurse Dana");
  });

  it("tolerates an empty request body", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    mockedAcknowledgeSession.mockResolvedValue(undefined);

    const res = await POST(
      new Request("http://localhost/api/staff/sessions/abc/acknowledge", { method: "POST" }),
      makeParams("abc")
    );

    expect(res.status).toBe(200);
    expect(mockedAcknowledgeSession).toHaveBeenCalledWith("abc", null);
  });

  it("returns 400 for an invalid acknowledgedBy (empty string)", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);

    const res = await POST(makeRequest({ acknowledgedBy: "" }), makeParams("abc"));

    expect(res.status).toBe(400);
    expect(mockedAcknowledgeSession).not.toHaveBeenCalled();
  });

  it("returns 500 (not a crash) if the DB update fails", async () => {
    mockedAuth.mockResolvedValue(FAKE_SESSION);
    mockedAcknowledgeSession.mockRejectedValue(new Error("connection refused"));

    const res = await POST(makeRequest({}), makeParams("abc"));

    expect(res.status).toBe(500);
  });
});
