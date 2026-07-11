"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertBar } from "@/components/staff/AlertBar";
import { NewRedBanner } from "@/components/staff/NewRedBanner";
import { PatientWorklistTable } from "@/components/staff/PatientWorklistTable";
import { useNewRedAlerts } from "@/lib/realtime/subscribe";
import type { NewRedEventPayload } from "@/lib/realtime/constants";
import type { StaffSessionsResponse, StaffSessionSummary } from "@/types/api";

// Amber/Green rows stay poll-only per the plan's confirmed decision; Red
// gets an instant push via Pusher (see useNewRedAlerts below) on top of
// this, so a Red session never waits a full poll cycle to appear.
const POLL_INTERVAL_MS = 25_000;
// Separate, faster tick just to keep the "N min ago" elapsed-time badges
// live-updating between polls, without refetching data.
const CLOCK_TICK_MS = 30_000;

export default function StaffDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StaffSessionSummary[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [newRedAlert, setNewRedAlert] = useState<NewRedEventPayload | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/sessions");
      if (!res.ok) return;
      const data: StaffSessionsResponse = await res.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to poll staff worklist", err);
    }
  }, []);

  useEffect(() => {
    // fetchSessions only ever calls setState from inside its own resolved
    // fetch callback, never synchronously in this effect body — this is
    // the standard "subscribe to an external system" pattern the rule
    // itself endorses, just triggered immediately (poll) rather than via a
    // subscription callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
    const interval = setInterval(fetchSessions, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    const clock = setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(clock);
  }, []);

  const handleNewRed = useCallback(
    (payload: NewRedEventPayload) => {
      setNewRedAlert(payload);
      fetchSessions();
    },
    [fetchSessions]
  );

  useNewRedAlerts(handleNewRed);

  return (
    <div className="min-h-full">
      <AlertBar sessions={sessions} />
      <NewRedBanner alert={newRedAlert} onDismiss={() => setNewRedAlert(null)} />
      <PatientWorklistTable
        sessions={sessions}
        nowMs={nowMs}
        onOpenSession={(id) => router.push(`/staff/dashboard/${id}`)}
      />
    </div>
  );
}
