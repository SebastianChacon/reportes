import { tc } from "@/lib/i18n";

/**
 * A number that is the whole chart.
 *
 * The most underused form on any dashboard: a single current value does not
 * need a plot, and drawing one bar for it is how a screen starts looking busy
 * without saying more.
 *
 * The delta is the part that earns its place. "5,397 hours" is a fact nobody can
 * act on; "5,397 hours, 4% more than the six weeks before" is a question.
 */

export type Direction = "up-good" | "up-bad" | "neutral";

export function StatTile({
  label,
  value,
  hint,
  delta,
  direction = "neutral",
  emphasis,
}: {
  label: string;
  value: string;
  /** One short line under the value — the unit, or the honest caveat. */
  hint?: string;
  /** Share against the period before, e.g. -0.12. Null when there was none. */
  delta?: number | null;
  direction?: Direction;
  /** The one number the screen leads with. Exactly one per view. */
  emphasis?: boolean;
}) {
  return (
    <div className="card flex flex-col p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--ink-muted)]">
        {label}
      </p>

      {/* Proportional figures, not tabular: equal-width digits make a large
          standalone number look loose. Columns get tabular-nums; this does not. */}
      <p
        className={`mt-1 font-bold tracking-tight ${
          emphasis ? "text-3xl sm:text-[2.75rem] sm:leading-[1.1]" : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </p>

      {hint && <p className="mt-1 text-xs text-[color:var(--ink-muted)]">{hint}</p>}

      {delta !== undefined && <Delta value={delta} direction={direction} />}
    </div>
  );
}

/**
 * The change against the period before.
 *
 * Colour never carries this alone — the arrow and the sign say the same thing,
 * so the meaning survives a printout and a reader who cannot separate the green
 * from the brown. `neutral` gets no colour at all, because for most of these
 * numbers "up" is neither good nor bad, it is just bigger.
 */
function Delta({ value, direction }: { value: number | null; direction: Direction }) {
  if (value === null) {
    return (
      <p className="mt-2 text-xs text-[color:var(--ink-muted)]">{tc("deltaNoBase")}</p>
    );
  }

  const points = Math.round(value * 100);

  // A change that rounds to nothing is not a rise. Printing "+0%" beside a green
  // up-arrow tells the reader something moved when the honest answer is that it
  // held — and on a screen whose whole job is spotting movement, that is the one
  // false positive worth ruling out.
  const flat = points === 0;
  const up = points > 0;
  const good = flat ? null : direction === "up-good" ? up : direction === "up-bad" ? !up : null;

  const tone =
    good === null
      ? "text-[color:var(--ink-muted)]"
      : good
        ? "text-[color:var(--ok)]"
        : "text-[color:var(--warn)]";

  return (
    <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${tone}`}>
      {!flat && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d={up ? "M12 19V5m0 0l-6 6m6-6l6 6" : "M12 5v14m0 0l-6-6m6 6l6-6"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="tabular-nums">
        {flat ? tc("deltaFlat") : `${up ? "+" : "−"}${Math.abs(points)}%`}
      </span>
      <span className="font-normal text-[color:var(--ink-muted)]">{tc("vsPrevious")}</span>
    </p>
  );
}
