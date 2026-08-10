"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { tc } from "@/lib/i18n";

type Status = "submitted" | "needs_review" | "approved";

/**
 * The two things the office does to a report.
 *
 * "Send back with a note" is the one that closes a loop that does not exist
 * today: the report reappears on the foreman's phone with the reason, and he
 * fixes it. Approving is the quiet half — one click, no dialog, because
 * agreeing with a report is the common case and should cost nothing.
 */
export function ReviewActions({ reportId, status }: { reportId: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<null | "approve" | "sendBack">(null);
  const [composing, setComposing] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [failed, setFailed] = React.useState(false);

  const noteId = React.useId();
  const noteRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (composing) noteRef.current?.focus();
  }, [composing]);

  async function send(next: Status, withNote?: string) {
    setBusy(next === "approved" ? "approve" : "sendBack");
    setFailed(false);
    try {
      const response = await fetch("/api/office/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reportId, status: next, note: withNote }),
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setComposing(false);
      setNote("");
      // The page is a server component reading Convex, so the new status comes
      // back through the same path that drew it — no local copy to keep in sync.
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  const trimmed = note.trim();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => send("approved")}
            className="min-h-11 rounded-xl bg-[color:var(--accent)] px-4 text-[15px] font-semibold text-[color:var(--accent-contrast)] transition active:scale-[0.99] disabled:opacity-50"
          >
            {busy === "approve" ? tc("approving") : tc("approve")}
          </button>
        )}

        {status !== "needs_review" && (
          <button
            type="button"
            disabled={busy !== null}
            aria-expanded={composing}
            onClick={() => setComposing((open) => !open)}
            className="min-h-11 rounded-xl border-[1.5px] border-[color:var(--line)] px-4 text-[15px] font-semibold transition hover:bg-[color:var(--accent-soft)] disabled:opacity-50"
          >
            {tc("sendBack")}
          </button>
        )}

        {/* A report already sent back can be put straight back in the queue —
            otherwise the only way out of `needs_review` is approving it. */}
        {status === "needs_review" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => send("submitted")}
            className="min-h-11 rounded-xl border-[1.5px] border-[color:var(--line)] px-4 text-[15px] font-semibold transition hover:bg-[color:var(--accent-soft)] disabled:opacity-50"
          >
            {tc("reopen")}
          </button>
        )}
      </div>

      {composing && (
        <div className="card p-4">
          <label htmlFor={noteId} className="mb-1.5 block text-sm font-medium">
            {tc("noteLabel")}
          </label>
          <textarea
            id={noteId}
            ref={noteRef}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tc("notePlaceholder")}
            className="field resize-y leading-relaxed"
          />
          <p className="mt-1.5 text-xs text-[color:var(--ink-muted)]">{tc("noteShown")}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null || trimmed.length === 0}
              onClick={() => send("needs_review", trimmed)}
              className="min-h-11 rounded-xl bg-[color:var(--accent)] px-4 text-[15px] font-semibold text-[color:var(--accent-contrast)] transition active:scale-[0.99] disabled:opacity-40"
            >
              {busy === "sendBack" ? tc("sendingBack") : tc("sendBack")}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                setComposing(false);
                setNote("");
              }}
              className="min-h-11 rounded-xl px-4 text-[15px] font-semibold text-[color:var(--ink-muted)] transition hover:text-[color:var(--ink)]"
            >
              {tc("cancel")}
            </button>
          </div>

          {trimmed.length === 0 && (
            <p className="mt-2 text-xs text-[color:var(--ink-muted)]">{tc("noteRequired")}</p>
          )}
        </div>
      )}

      {failed && (
        <p
          role="alert"
          className="rounded-lg border border-[color:var(--warn)]/40 bg-[color:var(--warn-soft)] px-3 py-2 text-sm font-medium text-[color:var(--warn)]"
        >
          {tc("actionFailed")}
        </p>
      )}
    </div>
  );
}
