import { tc, type ConsoleKey } from "@/lib/i18n";

export type ReportStatus = "submitted" | "needs_review" | "approved";

const STATUS_LABEL: Record<ReportStatus, ConsoleKey> = {
  submitted: "statusSubmitted",
  needs_review: "statusNeedsReview",
  approved: "statusApproved",
};

/**
 * Colour is never the only signal — each status also reads as a different word,
 * so the chips still separate for someone who cannot tell the greens from the
 * browns, and in a printout.
 */
const STATUS_STYLE: Record<ReportStatus, string> = {
  submitted:
    "border-[color:var(--line)] bg-[color:var(--surface-raised)] text-[color:var(--ink-muted)]",
  needs_review:
    "border-[color:var(--warn)]/40 bg-[color:var(--warn-soft)] text-[color:var(--warn)]",
  approved: "border-[color:var(--ok)]/40 bg-[color:var(--ok-soft)] text-[color:var(--ok)]",
};

export function StatusChip({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {tc(STATUS_LABEL[status])}
    </span>
  );
}

/**
 * The soft checks the phone already ran, shown before anyone opens the report.
 *
 * Read from what was stored at write time rather than re-run here: the report
 * the office is looking at has to be the report the foreman sent, warnings and
 * all, even if the rules have changed since.
 */
const FLAG_LABEL: Record<string, ConsoleKey> = {
  warnLongDay: "flagLongDay",
  warnNoCrew: "flagNoCrew",
  warnNoHours: "flagNoHours",
};

export function FlagChips({ flags }: { flags: { key: string; field: string | null }[] }) {
  // An unknown key is a flag written by a newer build of the phone. Skipping it
  // is better than printing a raw identifier at a project manager.
  const known = flags.filter((flag) => flag.key in FLAG_LABEL);
  if (known.length === 0) return null;

  return (
    <>
      {known.map((flag) => (
        <span
          key={flag.key}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--warn)]/40 bg-[color:var(--warn-soft)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--warn)]"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 8v5m0 3.5v.5M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {tc(FLAG_LABEL[flag.key])}
        </span>
      ))}
    </>
  );
}
