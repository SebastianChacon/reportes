import { tc } from "@/lib/i18n";

/**
 * The frame every chart on the summary sits in.
 *
 * Three things it guarantees, so no individual chart has to remember them:
 *
 * - **A legend whenever there are two series.** Identity never rests on colour
 *   alone. One series gets no legend box at all — the title already names it,
 *   and a box with a single swatch is the title said twice.
 * - **A table under every chart.** Not an accessibility footnote: it is the
 *   thing that makes a colour a supplement rather than the only channel, and it
 *   is what a project manager copies into an email.
 * - **Room for the axis.** The card grows with its content instead of fixing a
 *   height, so a long axis label can never end up in a nested scrollbar.
 */

export type Tone = "ours" | "theirs";

const FILL: Record<Tone, string> = {
  ours: "var(--viz-ours)",
  theirs: "var(--viz-theirs)",
};

export function fill(tone: Tone): string {
  return FILL[tone];
}

export type LegendItem = { tone: Tone; label: string };

export function Legend({ items }: { items: LegendItem[] }) {
  // One series needs no legend: there is only one colour, and the title said it.
  if (items.length < 2) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ background: fill(item.tone) }}
          />
          {/* Text wears text tokens, never the series colour — a mark beside the
              word carries the identity, so the word stays readable. */}
          <span className="text-[color:var(--ink-muted)]">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export type TableSpec = {
  head: string[];
  rows: (string | number)[][];
  /** Column indexes that hold numbers, right-aligned and tabular. */
  numeric?: number[];
};

export function ChartCard({
  title,
  subtitle,
  legend,
  table,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  table?: TableSpec;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">{subtitle}</p>
          )}
        </div>
        {legend && <Legend items={legend} />}
      </div>

      {children}

      {table && <TableView table={table} />}
    </section>
  );
}

/**
 * The chart's twin, in words.
 *
 * Closed by default so it never competes with the picture, and a real `<table>`
 * rather than a grid of divs, so a screen reader reads it as rows and columns
 * and a browser lets it be selected and pasted.
 */
export function TableView({ table }: { table: TableSpec }) {
  const numeric = new Set(table.numeric ?? []);

  return (
    <details className="group border-t border-[color:var(--line)] pt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-muted)] transition hover:text-[color:var(--ink)]">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="transition-transform group-open:rotate-90"
        >
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {tc("seeTable")}
      </summary>

      {/* A wide table scrolls inside itself. The page never moves sideways. */}
      <div className="scroll-x mt-3 -mx-1 px-1">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)]">
              {table.head.map((cell, at) => (
                <th
                  key={cell}
                  scope="col"
                  className={`whitespace-nowrap py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)] ${
                    numeric.has(at) ? "text-right pr-0 pl-4" : "text-left"
                  }`}
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, at) => (
              <tr key={at} className="border-b border-[color:var(--line)] last:border-0">
                {row.map((cell, column) => (
                  <td
                    key={column}
                    className={`py-2 pr-4 ${
                      numeric.has(column)
                        ? "pl-4 pr-0 text-right font-semibold tabular-nums"
                        : "text-left"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Said out loud rather than drawn as an empty axis. */
export function NoData({ message }: { message?: string }) {
  return (
    <p className="py-8 text-center text-sm text-[color:var(--ink-muted)]">
      {message ?? tc("vizNoData")}
    </p>
  );
}
