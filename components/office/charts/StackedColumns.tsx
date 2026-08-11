import { fill, NoData } from "./Card";

/**
 * Trend and composition in one picture.
 *
 * Two series stacked rather than two lines side by side, because the question is
 * both "is the total moving" and "what is it made of" — and two lines on one
 * plot would need either a second axis (never) or the loss of the total.
 *
 * Everything is a percentage of a fixed pixel height, which is what lets this be
 * plain HTML: no measuring, no `ResizeObserver`, no client JavaScript, and the
 * whole thing reflows on a phone by itself.
 */

export type Column = {
  key: string;
  /** Under the column. Kept to a few characters — this is the x axis. */
  label: string;
  /** The bottom segment. */
  ours: number;
  /** The top segment. */
  theirs: number;
  /** Shown on hover and on keyboard focus. Never the only place a value lives. */
  tip: string;
  /** Direct label on the cap. Selective on purpose — never one per column. */
  cap?: string;
};

const PLOT_HEIGHT = 168;

export function StackedColumns({ columns }: { columns: Column[] }) {
  const max = Math.max(...columns.map((column) => column.ours + column.theirs), 0);
  if (max <= 0) return <NoData />;

  // Rounded up to a clean number so the gridlines land on values a reader can
  // name, rather than on 173.4.
  const ceiling = niceCeiling(max);

  return (
    <div className="flex gap-3">
      <YAxis ceiling={ceiling} />

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height: PLOT_HEIGHT }}>
          {/* Hairline, solid, one step off the surface. Never dashed: a dashed
              grid reads as a threshold when it is only a ruler. */}
          {[0, 0.25, 0.5, 0.75, 1].map((at) => (
            <div
              key={at}
              aria-hidden="true"
              className="absolute inset-x-0 border-t"
              style={{ bottom: `${at * 100}%`, borderColor: "var(--viz-grid)" }}
            />
          ))}

          <ul className="absolute inset-0 flex items-end justify-between gap-1">
            {columns.map((column, at) => {
              const total = column.ours + column.theirs;
              return (
                <li key={column.key} className="flex min-w-0 flex-1 justify-center">
                  <div
                    tabIndex={0}
                    className="viz-mark w-full max-w-[24px] rounded-[4px]"
                    style={{ height: PLOT_HEIGHT }}
                  >
                    <span
                      className={`viz-tip ${edge(at, columns.length)}`}
                      role="tooltip"
                    >
                      {column.tip}
                    </span>

                    {/* column-reverse puts `ours` at the baseline; the 2px gap is
                        the surface separating the two fills, not a stroke. */}
                    <div
                      className="flex h-full w-full flex-col-reverse justify-start"
                      style={{ gap: 2 }}
                    >
                      <Segment
                        value={column.ours}
                        ceiling={ceiling}
                        tone="ours"
                        corner="bottom"
                      />
                      <Segment
                        value={column.theirs}
                        ceiling={ceiling}
                        tone="theirs"
                        corner="top"
                      />
                    </div>

                    {column.cap && total > 0 && (
                      <span
                        className="pointer-events-none absolute inset-x-0 text-center text-[11px] font-semibold tabular-nums text-[color:var(--ink-muted)]"
                        style={{ bottom: `calc(${(total / ceiling) * 100}% + 4px)` }}
                      >
                        {column.cap}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <ul className="mt-2 flex justify-between gap-1">
          {columns.map((column) => (
            <li
              key={column.key}
              className="min-w-0 flex-1 text-center text-[11px] tabular-nums text-[color:var(--ink-muted)]"
            >
              {column.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Segment({
  value,
  ceiling,
  tone,
  corner,
}: {
  value: number;
  ceiling: number;
  tone: "ours" | "theirs";
  corner: "top" | "bottom";
}) {
  if (value <= 0) return null;
  return (
    <div
      className={corner === "top" ? "rounded-t-[4px]" : ""}
      style={{ height: `${(value / ceiling) * 100}%`, background: fill(tone) }}
    />
  );
}

/** Keeps a tooltip on the first or last column inside the card. */
function edge(at: number, count: number): string {
  if (at === 0) return "viz-tip-start";
  if (at === count - 1) return "viz-tip-end";
  return "";
}

function YAxis({ ceiling }: { ceiling: number }) {
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <ul
      aria-hidden="true"
      className="flex w-10 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-[color:var(--ink-muted)]"
      style={{ height: PLOT_HEIGHT }}
    >
      {ticks.map((at) => (
        // Nudged up half a line so each number sits on its gridline rather than
        // hanging below it.
        <li key={at} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
          {Math.round(ceiling * at).toLocaleString("en-US")}
        </li>
      ))}
    </ul>
  );
}

/** 173 → 200, 1,840 → 2,000. Axis ticks should be numbers people say out loud. */
export function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    if (magnitude * step >= max) return magnitude * step;
  }
  return magnitude * 10;
}
