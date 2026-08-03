"use client";

import React from "react";
import { downloadPdf } from "@/lib/pdf";
import { t } from "@/lib/i18n";
import type { OutboxItem } from "@/lib/storage";
import type { Lang } from "@/lib/types";
import { Button } from "./ui";

/**
 * A report only ends up here when sending failed (dead zone, bad wifi) —
 * `queueReport` in storage.ts already saved it. This is the part that was
 * missing: somewhere the foreman can actually see it and push "resend".
 */
export function OutboxPanel({
  lang,
  items,
  resendingId,
  onResend,
  onClose,
}: {
  lang: Lang;
  items: OutboxItem[];
  resendingId: string | null;
  onResend: (item: OutboxItem) => void;
  onClose: () => void;
}) {
  const queuedAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang === "es" ? "es" : "en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("pendingReports", lang)}
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[80dvh] w-full max-w-sm flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="text-[15px] font-bold">{t("pendingReports", lang)}</p>
          <button
            type="button"
            aria-label={t("close", lang)}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[color:var(--ink-muted)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-xs text-[color:var(--ink-muted)]">{t("pendingHint", lang)}</p>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[color:var(--line)] px-3 py-4 text-center text-sm text-[color:var(--ink-muted)]">
            {t("pendingEmpty", lang)}
          </p>
        ) : (
          <ul className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
            {items.map((item) => {
              const busy = resendingId === item.id;
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-[color:var(--line)] p-3"
                >
                  <p className="truncate text-[15px] font-semibold">
                    {item.report.clientName || "—"}
                  </p>
                  <p className="text-xs text-[color:var(--ink-muted)]">
                    {item.report.date} · {t("queuedAt", lang)} {queuedAt(item.queuedAt)}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <Button
                      variant="primary"
                      disabled={busy}
                      onClick={() => onResend(item)}
                      className="!min-h-9 flex-1 !py-2 !text-sm"
                    >
                      {busy ? t("sending", lang) : t("resend", lang)}
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => downloadPdf(item.report, lang)}
                      className="!min-h-9 flex-1 !py-2 !text-sm"
                    >
                      {t("downloadPdf", lang)}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
