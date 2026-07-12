import { z } from "zod";
import { identifyPatientSession } from "@/lib/db/sessions";

const identifyRequestSchema = z.object({
  sessionId: z.string().min(1),
  patientName: z.string().min(1),
  contactNumber: z.string().min(1),
});

/**
 * Writes the progressive-identification prompt's answer (name + contact
 * number) to an existing PatientSession row — see
 * components/chat/IdentifyPrompt.tsx. Deliberately separate from
 * /api/chat: identification is a side channel for staff follow-up, not
 * part of the turn-by-turn triage flow, and must never be able to delay or
 * block the patient's own emergency guidance, which is conveyed as the
 * graded chat message itself, produced entirely by /api/chat, never by
 * this route.
 */
export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const parsed = identifyRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    await identifyPatientSession(parsed.data.sessionId, {
      patientName: parsed.data.patientName,
      contactNumber: parsed.data.contactNumber,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Failed to save patient identification", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
