import "server-only";
import Pusher from "pusher";
import {
  NEW_RED_EVENT,
  STAFF_ALERTS_CHANNEL,
  type NewRedEventPayload,
} from "@/lib/realtime/constants";

let client: Pusher | null = null;

function getPusherClient(): Pusher {
  if (!client) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!appId || !key || !secret || !cluster) {
      throw new Error("Pusher environment variables are not fully set");
    }
    client = new Pusher({ appId, key, secret, cluster, useTLS: true });
  }
  return client;
}

/**
 * Triggers the staff dashboard's real-time Red alert (see subscribe.ts for
 * the client-side listener). Deliberately isolated behind this one function
 * so the concrete provider stays swappable — see the plan's Tech stack
 * section. Callers must treat this as best-effort, exactly like
 * lib/db/sessions.ts's recordChatTurn: a Pusher outage must never break,
 * delay, or alter the patient-facing chat response, so this always runs
 * after the response is already computed and callers should catch, not
 * propagate, any failure.
 */
export async function publishNewRedEvent(payload: NewRedEventPayload): Promise<void> {
  const pusher = getPusherClient();
  await pusher.trigger(STAFF_ALERTS_CHANNEL, NEW_RED_EVENT, payload);
}
