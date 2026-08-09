"use client";

import { downloadPdf } from "@/lib/pdf";
import { t } from "@/lib/i18n";
import type { HistoryEntry } from "@/lib/storage";
import type { Lang } from "@/lib/types";
import { Button } from "./ui";

/**
 * The last reports that left this phone.
 *
 * The share sheet resolves when the OS hands the PDF to Gmail, not when the
 * mail goes out — so "sent" is really "handed over". A foreman who abandons the
 * draft in Gmail, or shares into the wrong app, used to have nothing left: the
 * report's own draft was cleared on the strength of that resolve. This is where
 * it survives, and where it can be sent again without being retyped.
 */
export function HistoryPanel({
  lang,
  entries,
  onShare,
  onClose,
}: {
  lang: Lang;
  entries: HistoryEntry[];
  onShare: (entry: HistoryEntry) => void;
  onClose: () => void;
}) {
  const sentAt = (iso: string) => {
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
      aria-label={t("history", lang)}
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[80dvh] w-full max-w-sm flex-col p-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="text-[15px] font-bold">{t("history", lang)}</p>
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
        <p className="mb-4 text-xs text-[color:var(--ink-muted)]">{t("historyHint", lang)}</p>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[color:var(--line)] px-3 py-4 text-center text-sm text-[color:var(--ink-muted)]">
            {t("historyEmpty", lang)}
          </p>
        ) : (
          <ul className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[color:var(--line)] p-3">
                <p className="truncate text-[15px] font-semibold">
                  {entry.report.clientName || "—"}
                </p>
                <p className="text-xs text-[color:var(--ink-muted)]">
                  {entry.report.date} · {sentAt(entry.sentAt)}
                  {entry.photosDropped && ` · ${t("historyNoPhotos", lang)}`}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => onShare(entry)}
                    className="!min-h-9 flex-1 !py-2 !text-sm"
                  >
                    {t("sendAgain", lang)}
                  </Button>
                  <Button
                    onClick={() => downloadPdf(entry.report, lang)}
                    className="!min-h-9 flex-1 !py-2 !text-sm"
                  >
                    {t("downloadPdf", lang)}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
