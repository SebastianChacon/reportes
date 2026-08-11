import Link from "next/link";
import { tc } from "@/lib/i18n";
import { startOfWeek } from "@/lib/officeDate";
import { NoData } from "./Card";

/**
 * The month, foreman by foreman, day by day.
 *
 * The one view a mailbox structurally cannot produce. An inbox can only show
 * what arrived; a grid can show a hole — and the hole is the finding. Everything
 * else on this screen tells the office what happened. This one tells them what
 * didn't.
 *
 * Two encodings, and the distinction between them is the whole design:
 *
 * - **Filled** — a report exists, and the step says how many crew hours it
 *   carried. One hue, light to dark: this is magnitude, not identity.
 * - **Hollow** — nothing was filed. Deliberately *not* the lightest step of the
 *   ramp. An absence is not a small amount, and drawing it as one would bury the
 *   only thing worth looking for.
 *
 * Columns are grouped into weeks with air between them, because 37 evenly
 * spaced squares is a barcode: the reader has to be able to say "that was the
 * week of the 20th" without counting.
 */

export type Cell = {
  date: string;
  crewHours: number | null;
  reports: number;
  flagged: boolean;
};

export type Row = {
  name: string;
  /** Roster id, so a name goes to that person's week. Null for unattributed. */
  crewMemberId: string | null;
  cells: Cell[];
};

const STEPS = [
  "var(--viz-seq-1)",
  "var(--viz-seq-2)",
  "var(--viz-seq-3)",
  "var(--viz-seq-4)",
  "var(--viz-seq-5)",
];

export function Heatmap({
  rows,
  days,
  locale,
  formatHours,
}: {
  rows: Row[];
  days: string[];
  locale: string;
  formatHours: (n: number) => string;
}) {
  if (rows.length === 0 || days.length === 0) return <NoData />;

  const max = Math.max(
    ...rows.flatMap((row) => row.cells.map((cell) => cell.crewHours ?? 0)),
    0
  );

  const weeks = groupByWeek(days);
  const dayLabel = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const weekLabel = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="scroll-x -mx-1 px-1 pb-1">
        <div className="flex min-w-max flex-col gap-1.5">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center gap-3">
              <div className="w-32 shrink-0 truncate text-right text-xs font-medium sm:w-40 sm:text-sm">
                {row.crewMemberId ? (
                  <Link
                    href={`/office/personas/${encodeURIComponent(row.crewMemberId)}`}
                    className="rounded transition hover:underline"
                  >
                    {row.name}
                  </Link>
                ) : (
                  <span className="italic text-[color:var(--ink-muted)]">{row.name}</span>
                )}
              </div>

              <div className="flex gap-2.5">
                {weeks.map((week) => (
                  <div key={week.start} className="flex gap-[2px]">
                    {week.days.map((date) => {
                      const cell = row.cells.find((entry) => entry.date === date);
                      return (
                        <Square
                          key={date}
                          cell={cell}
                          date={date}
                          max={max}
                          label={dayLabel.format(new Date(`${date}T12:00:00Z`))}
                          formatHours={formatHours}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* The week each group belongs to, under the grid rather than above
              it, so the eye lands on the pattern first and the dates second. */}
          <div className="mt-1 flex items-center gap-3">
            <div className="w-32 shrink-0 sm:w-40" />
            <div className="flex gap-2.5">
              {weeks.map((week) => (
                <div
                  key={week.start}
                  className="text-[10px] tabular-nums text-[color:var(--ink-muted)]"
                  style={{ width: week.days.length * 22 + (week.days.length - 1) * 2 }}
                >
                  {weekLabel.format(new Date(`${week.start}T12:00:00Z`))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ScaleLegend max={max} formatHours={formatHours} />
    </div>
  );
}

function Square({
  cell,
  date,
  max,
  label,
  formatHours,
}: {
  cell: Cell | undefined;
  date: string;
  max: number;
  label: string;
  formatHours: (n: number) => string;
}) {
  const hours = cell?.crewHours ?? null;
  const filed = hours !== null;

  const style: React.CSSProperties = filed
    ? { background: STEPS[stepFor(hours, max)] }
    : {
        background: "var(--surface-raised)",
        // Hollow, not pale: the border is what makes "nothing here" read as a
        // different kind of thing rather than as the bottom of the scale.
        boxShadow: "inset 0 0 0 1px var(--viz-grid)",
      };

  return (
    <div
      tabIndex={0}
      className="viz-mark rounded-[3px]"
      style={{
        width: 22,
        height: 22,
        ...style,
        ...(cell?.flagged ? { outline: "2px solid var(--warn)", outlineOffset: -2 } : {}),
      }}
    >
      <span className="viz-tip" role="tooltip">
        <span className="block font-semibold">{label}</span>
        <span className="block">
          {filed
            ? `${formatHours(hours)} ${tc("hours")}${cell && cell.reports > 1 ? ` · ${cell.reports}` : ""}`
            : tc("vizNotFiled")}
        </span>
        {cell?.flagged && (
          <span className="block font-semibold text-[color:var(--warn)]">{tc("vizFlagged")}</span>
        )}
      </span>
      {/* The date is on the mark for a screen reader even though the square is
          drawn empty, so the grid is navigable rather than 185 unlabelled boxes. */}
      <span className="sr-only">
        {date}: {filed ? formatHours(hours) : tc("vizNotFiled")}
      </span>
    </div>
  );
}

/**
 * Required, not optional: a continuous colour scale that does not say what its
 * steps mean is a picture of a pattern nobody can quantify.
 */
function ScaleLegend({ max, formatHours }: { max: number; formatHours: (n: number) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[color:var(--ink-muted)]">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-[3px]"
          style={{
            background: "var(--surface-raised)",
            boxShadow: "inset 0 0 0 1px var(--viz-grid)",
          }}
        />
        {tc("vizNotFiled")}
      </span>

      <span className="flex items-center gap-1.5">
        <span>0</span>
        <span aria-hidden="true" className="flex gap-[2px]">
          {STEPS.map((step) => (
            <span key={step} className="h-3 w-4 rounded-[2px]" style={{ background: step }} />
          ))}
        </span>
        <span className="tabular-nums">
          {formatHours(max)} {tc("hours")}
        </span>
      </span>

      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-[3px]"
          style={{ outline: "2px solid var(--warn)", outlineOffset: -2 }}
        />
        {tc("vizFlagged")}
      </span>
    </div>
  );
}

/** Which of the five steps a value lands on. Empty never reaches here. */
function stepFor(value: number, max: number): number {
  if (max <= 0) return 0;
  const at = Math.ceil((value / max) * STEPS.length) - 1;
  return Math.min(Math.max(at, 0), STEPS.length - 1);
}

function groupByWeek(days: string[]): { start: string; days: string[] }[] {
  const weeks: { start: string; days: string[] }[] = [];
  for (const date of days) {
    const start = startOfWeek(date);
    const last = weeks[weeks.length - 1];
    if (last && last.start === start) last.days.push(date);
    else weeks.push({ start, days: [date] });
  }
  return weeks;
}
