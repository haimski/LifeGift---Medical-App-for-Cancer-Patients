import { auth } from "@/lib/auth/staffAuth";
import { getSessionDetail } from "@/lib/db/sessions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getSessionDetail(id);
    if (!detail) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(detail);
  } catch (err) {
    console.error("Failed to load session detail", err);
    return Response.json({ error: "failed_to_load" }, { status: 500 });
  }
}
