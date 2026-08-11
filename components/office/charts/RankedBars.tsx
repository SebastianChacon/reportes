import { fill, NoData } from "./Card";

/**
 * A ranking, read top to bottom.
 *
 * Horizontal because the categories are client names and machine names, and a
 * vertical column chart would either clip them or turn every label 45 degrees.
 *
 * **One colour for every bar.** The obvious temptation is to shade each bar
 * darker where it is bigger; that double-encodes length as hue, spends the only
 * free channel on information the chart already carries, and fails every
 * categorical check by construction. The bars are already sorted — the ranking
 * is the encoding.
 */

export type Bar = {
  key: string;
  label: string;
  /** What the bar length means. */
  value: number;
  /** Printed at the tip: the value, formatted. */
  valueLabel: string;
  /** One quiet line of context under the label — job numbers, a second measure. */
  meta?: string;
  tip: string;
  href?: string;
};

export function RankedBars({ bars, tone = "ours" }: { bars: Bar[]; tone?: "ours" | "theirs" }) {
  const max = Math.max(...bars.map((bar) => bar.value), 0);
  if (bars.length === 0 || max <= 0) return <NoData />;

  return (
    <ul className="flex flex-col gap-3">
      {bars.map((bar) => (
        <li key={bar.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium">
              {bar.label}
              {bar.meta && (
                <span className="ml-2 text-xs font-normal text-[color:var(--ink-muted)]">
                  {bar.meta}
                </span>
              )}
            </span>
            {/* The value at the tip of the bar, in a text token — never in the
                series colour, which is unreadable as small text. */}
            <span className="shrink-0 text-sm font-semibold tabular-nums figure">{bar.valueLabel}</span>
          </div>

          <div
            tabIndex={0}
            className="viz-mark rounded-full"
            style={{ background: "var(--viz-track)", height: 10 }}
          >
            <span className="viz-tip viz-tip-start" role="tooltip">
              {bar.tip}
            </span>
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${Math.max((bar.value / max) * 100, 1.5)}%`,
                background: fill(tone),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
