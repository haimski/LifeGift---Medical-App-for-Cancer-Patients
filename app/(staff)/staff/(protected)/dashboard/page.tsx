"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertBar } from "@/components/staff/AlertBar";
import { PatientWorklistTable } from "@/components/staff/PatientWorklistTable";
import type { StaffSessionsResponse, StaffSessionSummary } from "@/types/api";

// Poll-only for now (no real-time push until Phase 9's Pusher wiring) —
// 20-30s per the plan's confirmed decision for Amber/Green rows.
const POLL_INTERVAL_MS = 25_000;
// Separate, faster tick just to keep the "N min ago" elapsed-time badges
// live-updating between polls, without refetching data.
const CLOCK_TICK_MS = 30_000;

export default function StaffDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StaffSessionSummary[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

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

  return (
    <div className="min-h-full">
      <AlertBar sessions={sessions} />
      <PatientWorklistTable
        sessions={sessions}
        nowMs={nowMs}
        onOpenSession={(id) => router.push(`/staff/dashboard/${id}`)}
      />
    </div>
  );
}
