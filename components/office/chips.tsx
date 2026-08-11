import { tc, type ConsoleKey } from "@/lib/i18n";
import { Check, Warning } from "./icons";

export type ReportStatus = "submitted" | "needs_review" | "approved";

const STATUS_LABEL: Record<ReportStatus, ConsoleKey> = {
  submitted: "statusSubmitted",
  needs_review: "statusNeedsReview",
  approved: "statusApproved",
};

/**
 * Three states, one ink.
 *
 * Colour was never the only signal here — each status also reads as a different
 * word — but it was doing the work of ranking them, and that job now falls to
 * the fill. The order is what a project manager is actually hunting for at 5pm:
 *
 *   needs_review  solid ink, inverted     — the only one that needs a person
 *   submitted     hairline outline        — it arrived and it waits
 *   approved      the stamp               — done, and it says so the way an
 *                                           office says it
 *
 * The old pale brown was the quietest thing on a list of thirty, which had it
 * exactly backwards. Solid ink is the loudest a single tint can be, and it is
 * spent on the one row somebody has to open.
 */
const STATUS_STYLE: Record<ReportStatus, string> = {
  submitted: "border-[color:var(--line)] text-[color:var(--ink-muted)]",
  needs_review:
    "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-contrast)]",
  // The stamp, compact: double rule and letterspacing, but square-on. The
  // tilted version lives on the report's own page, where there is one document
  // rather than thirty rows — see `ApprovedStamp`.
  approved:
    "border-[color:var(--ink)] text-[color:var(--ink)] uppercase tracking-[0.1em] [border-style:double] [border-width:3px]",
};

export function StatusChip({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {status === "approved" && <Check size={10} />}
      {tc(STATUS_LABEL[status])}
    </span>
  );
}

/**
 * The stamp, full size.
 *
 * What an office actually does to a finished job ticket, which is the one place
 * this design is allowed to raise its voice. It earns the tilt by being alone:
 * a single document on a single page. Thirty of these down a list would be
 * noise, so the list gets the square-on chip above instead.
 *
 * `aria-hidden` because the status is already announced by the chip in the
 * report's header — this is the same fact drawn larger, not a second one.
 */
export function ApprovedStamp() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none inline-flex select-none items-center gap-2 rounded-lg border-[3px] border-double border-[color:var(--ink)] px-3 py-1.5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--ink)] opacity-90 [rotate:-4deg]"
    >
      <Check size={15} />
      {tc("statusApproved")}
    </span>
  );
}

/**
 * The soft checks the phone already ran, shown before anyone opens the report.
 *
 * Read from what was stored at write time rather than re-run here: the report
 * the office is looking at has to be the report the foreman sent, warnings and
 * all, even if the rules have changed since.
 *
 * The glyph was always the real signal and the brown only sat behind it, so
 * losing the tint costs nothing. The outline keeps these subordinate to the
 * status chip beside them — a flag is a note about a report, not its state.
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
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--ink)]"
        >
          <Warning size={11} />
          {tc(FLAG_LABEL[flag.key])}
        </span>
      ))}
    </>
  );
}
