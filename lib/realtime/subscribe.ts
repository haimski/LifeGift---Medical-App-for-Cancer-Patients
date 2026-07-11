"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import {
  NEW_RED_EVENT,
  STAFF_ALERTS_CHANNEL,
  type NewRedEventPayload,
} from "@/lib/realtime/constants";

/**
 * Subscribes the staff dashboard to real-time Red alerts for the lifetime
 * of the component — see publish.ts for the server-side trigger. Only
 * NEXT_PUBLIC_-prefixed vars here, since this runs in the browser; the app
 * secret stays server-only. If Pusher itself is unreachable, this simply
 * never fires — the dashboard's existing ~25s poll is still the source of
 * truth, so a real-time outage degrades to "as if Phase 9 didn't exist"
 * rather than breaking anything.
 */
export function useNewRedAlerts(onNewRed: (payload: NewRedEventPayload) => void): void {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      console.error("Pusher client env vars are not set; real-time alerts disabled");
      return;
    }

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe(STAFF_ALERTS_CHANNEL);
    channel.bind(NEW_RED_EVENT, onNewRed);

    return () => {
      channel.unbind(NEW_RED_EVENT, onNewRed);
      pusher.unsubscribe(STAFF_ALERTS_CHANNEL);
      pusher.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onNewRed is expected to be a stable callback from the caller; re-subscribing on every render would thrash the Pusher connection
  }, []);
}

export type { NewRedEventPayload };
