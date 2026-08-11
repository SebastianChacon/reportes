import Link from "next/link";
import { tc, type ConsoleKey } from "@/lib/i18n";
import type { ReportStatus } from "./chips";

/**
 * "Show me only what still needs looking at."
 *
 * In the URL rather than in component state, for the same reason the search
 * filters are: it makes "what is left to review today" a link a project manager
 * can send instead of a set of instructions. It also survives the refresh that
 * follows approving a report from a card, which local state would not.
 *
 * Only rendered when there is something to filter. Four chips over a list of two
 * reports is furniture.
 */
const OPTIONS: { value: ReportStatus | null; label: ConsoleKey }[] = [
  { value: null, label: "showAll" },
  { value: "submitted", label: "statusSubmitted" },
  { value: "needs_review", label: "statusNeedsReview" },
  { value: "approved", label: "statusApproved" },
];

export function DayFilter({
  date,
  active,
  counts,
}: {
  date: string;
  active: ReportStatus | null;
  counts: Record<ReportStatus, number>;
}) {
  const total = counts.submitted + counts.needs_review + counts.approved;
  if (total === 0) return null;

  return (
    <nav aria-label={tc("filterStatus")} className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const n = option.value === null ? total : counts[option.value];
        // A filter that leads to an empty list is a dead end, so it is not
        // offered — except the one currently applied, which has to stay visible
        // or there would be no way to see why the list looks the way it does.
        const current = option.value === active;
        if (n === 0 && !current) return null;

        const href = option.value
          ? `/office?date=${date}&show=${option.value}`
          : `/office?date=${date}`;

        return (
          <Link
            key={option.label}
            href={href}
            aria-current={current ? "true" : undefined}
            scroll={false}
            className={`chip font-semibold transition ${
              current
                ? "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "text-[color:var(--ink-muted)] hover:border-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
            }`}
          >
            {tc(option.label)}
            <span className="tabular-nums opacity-70">{n}</span>
          </Link>
        );
      })}
    </nav>
  );
}
