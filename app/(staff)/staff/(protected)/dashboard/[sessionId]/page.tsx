"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DrillDownPanel } from "@/components/staff/DrillDownPanel";
import type { StaffSessionDetail } from "@/types/api";

export default function StaffSessionDrillDownPage() {
  const params = useParams<{ sessionId: string }>();
  const t = useTranslations("dashboard.drillDown");
  const [detail, setDetail] = useState<StaffSessionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/staff/sessions/${params.sessionId}`);
        if (cancelled) return;
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data: StaffSessionDetail = await res.json();
        setDetail(data);
      } catch (err) {
        console.error("Failed to load session detail", err);
        if (!cancelled) setNotFound(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.sessionId]);

  if (notFound) {
    return <p className="px-4 py-8 text-center text-sm text-foreground-muted">{t("notFound")}</p>;
  }
  if (!detail) return null;

  return <DrillDownPanel detail={detail} />;
}
