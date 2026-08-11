/**
 * The shapes a screen holds while it waits.
 *
 * Every page in the console is `force-dynamic` and awaits Convex, and until now
 * none of them had a `loading.tsx` — press a tab and nothing visibly happens
 * until the server answers. That is what makes a data console feel slow even
 * when it is not.
 *
 * Two rules these follow, and they are the difference between a skeleton that
 * helps and one that makes things worse:
 *
 * - **They reserve the real height.** A placeholder shorter than its content
 *   means the page jumps when the data lands, which is a worse experience than
 *   the blank wait it replaced.
 * - **They do not pulse.** A shimmer on four cards, twenty times a day, is an
 *   animation the reader has to look past to find out whether anything arrived.
 *   These are flat, quiet, and obviously not data — `--accent-soft` never
 *   carries real content anywhere else on the console.
 *
 * `aria-hidden`, with the live region left to the page: a screen reader should
 * hear "loading", not a description of eleven grey rectangles.
 */

export function Bar({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`block rounded bg-[color:var(--accent-soft)] ${className}`}
    />
  );
}

/** One of the four numbers across the top of the day, or five on the summary. */
export function StatSkeleton() {
  return (
    <div className="card p-4">
      <Bar className="h-3 w-20" />
      <Bar className="mt-3 h-8 w-24 sm:h-9" />
    </div>
  );
}

/** One report in a list. Matches `ReportCard`'s two rows plus its chips. */
export function CardSkeleton() {
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Bar className="h-4 w-48 max-w-full" />
          <Bar className="mt-2 h-3 w-32 max-w-full" />
        </div>
        <Bar className="h-5 w-20 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        <Bar className="h-3 w-24" />
        <Bar className="h-3 w-16" />
        <Bar className="h-3 w-16" />
      </div>
    </li>
  );
}

/** A chart card: title, subtitle, and the plot's own height held open. */
export function ChartSkeleton({ height = 168 }: { height?: number }) {
  return (
    <section className="card flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <Bar className="h-4 w-40" />
        <Bar className="mt-2 h-3 w-64 max-w-full" />
      </div>
      <Bar className="w-full" style={{ height }} />
    </section>
  );
}
