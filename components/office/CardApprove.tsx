"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { tc } from "@/lib/i18n";
import { Check, Warning } from "./icons";

/**
 * Approving without opening the report.
 *
 * Agreeing with a report is the common case, and until now it cost a page load,
 * a click, and a page load back — thirty times over on a Friday. `ReviewActions`
 * on the report's own page already said approving "should cost nothing"; this is
 * that sentence applied to the list.
 *
 * **No confirmation dialog.** Approving is reversible — `reopen` has always
 * existed — so a dialog would charge two clicks for the most frequent action in
 * the console to protect against something that is already undoable. Undo is the
 * right shape for a reversible action; confirmation is for the other kind.
 *
 * The undo window is why this component keeps state at all. On success it calls
 * `router.refresh()`, which re-renders the server component around it — but a
 * client component's state survives that, so the row stays and turns into
 * "Approved · Undo" over a card that now correctly reads approved.
 */

/** Long enough to catch a misclick, short enough not to linger over the list. */
const UNDO_WINDOW_MS = 10_000;

export function CardApprove({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<null | "approve" | "undo">(null);
  const [approved, setApproved] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // Closes the undo window on its own. Cleared on unmount so a card scrolled
  // out of a re-rendered list cannot set state on a component that is gone.
  React.useEffect(() => {
    if (!approved) return;
    const timer = window.setTimeout(() => setApproved(false), UNDO_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [approved]);

  async function send(status: "approved" | "submitted") {
    setBusy(status === "approved" ? "approve" : "undo");
    setFailed(false);
    try {
      const response = await fetch("/api/office/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reportId, status }),
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setApproved(status === "approved");
      // The list is a server component reading Convex, so the new status comes
      // back through the same path that drew it — no local copy to keep in sync.
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  if (failed) {
    return (
      <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold">
        <Warning size={12} />
        {tc("actionFailed")}
      </p>
    );
  }

  if (approved) {
    return (
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Check size={12} />
          {tc("approvedJustNow")}
        </span>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => send("submitted")}
          className="rounded font-semibold underline decoration-[color:var(--line)] underline-offset-4 transition hover:decoration-[color:var(--ink)] disabled:opacity-50"
        >
          {busy === "undo" ? tc("undoing") : tc("undo")}
        </button>
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={busy !== null}
      onClick={() => send("approved")}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[color:var(--line)] px-3 text-sm font-semibold transition hover:border-[color:var(--ink)] active:scale-[0.98] disabled:opacity-50"
    >
      <Check size={12} />
      {busy === "approve" ? tc("approving") : tc("approve")}
    </button>
  );
}
