"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Siren } from "lucide-react";
import type { NewRedEventPayload } from "@/lib/realtime/constants";

const AUTO_DISMISS_MS = 8_000;

interface NewRedBannerProps {
  alert: NewRedEventPayload | null;
  onDismiss: () => void;
}

/**
 * Slide-down-fade banner for a brand-new Red session arriving over Pusher
 * (see the plan's Graphic language section for the ~300ms timing). Purely a
 * notification — the worklist row itself is the source of truth and is
 * refetched separately on the same event — so this auto-dismisses rather
 * than needing an acknowledge action of its own.
 */
export function NewRedBanner({ alert, onDismiss }: NewRedBannerProps) {
  const t = useTranslations("dashboard.newRedBanner");

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.sessionId}
          role="alert"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center gap-2 border-b border-rag-red bg-rag-red-bg px-4 py-2.5 text-sm font-medium text-rag-red-badge-text sm:px-6"
        >
          <Siren aria-hidden className="h-4 w-4 shrink-0 text-rag-red" />
          <span>{t("message", { complaint: alert.presentingComplaint })}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
