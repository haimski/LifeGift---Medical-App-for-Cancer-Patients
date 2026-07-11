/**
 * Shared between the server-side publisher (publish.ts) and the client-side
 * subscriber (subscribe.ts) — safe to import from either, since it's just
 * plain constants/types, no SDK code. Deliberately Red-only: Amber/Green
 * rows stay poll-only (see the plan's Staff dashboard section), so this
 * channel only ever carries one event type.
 */
export const STAFF_ALERTS_CHANNEL = "staff-alerts";
export const NEW_RED_EVENT = "new-red-session";

/**
 * Deliberately light — just enough for the NewRedBanner to say something
 * specific immediately. The dashboard reacts to this by refetching the full
 * worklist (GET /api/staff/sessions), which is what actually populates the
 * row with its full, accurate shape (grade, trend, etc.) — this payload is
 * not the source of truth, just an instant "something changed, and here's
 * a preview" nudge.
 */
export interface NewRedEventPayload {
  sessionId: string;
  presentingComplaint: string;
}
