import { z } from "zod";
import { auth } from "@/lib/auth/staffAuth";
import { acknowledgeSession } from "@/lib/db/sessions";

const acknowledgeRequestSchema = z.object({
  acknowledgedBy: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    // Empty/missing body is fine — acknowledgedBy is optional.
  }

  const parsed = acknowledgeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    await acknowledgeSession(id, parsed.data.acknowledgedBy ?? null);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Failed to acknowledge session", err);
    return Response.json({ error: "failed_to_acknowledge" }, { status: 500 });
  }
}
