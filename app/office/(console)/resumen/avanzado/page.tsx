import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { GroupRow, Measure } from "@/lib/analytics";
import { convexServer } from "@/lib/convexServer";
import { CONSOLE_LANG, tc } from "@/lib/i18n";
import {
  breakdownQuery,
  DIMENSIONS,
  DIMENSION_LABEL,
  MEASURES,
  MEASURE_FORMAT,
  MEASURE_LABEL,
  parseBreakdown,
} from "@/lib/officeBreakdown";
import { shortDate } from "@/lib/officeDate";
import { hoursGrouped, money, moneyExact } from "@/lib/officeFormat";
import { parsePeriod, periodQuery } from "@/lib/officePeriod";
import { PeriodNav } from "@/components/office/PeriodNav";
import { Breadcrumb } from "@/components/office/Breadcrumb";

/**
 * Advanced.
 *
 * The summary is one question asked well: five numbers and four charts, chosen
 * so somebody who has never seen the screen learns something in thirty seconds.
 * This is the other user — and it is the same person three weeks later, who now
 * knows exactly what they are looking for and finds the summary's opinions in
 * the way.
 *
 * So: the axis comes loose. Group by whatever is being asked about, sort by
 * whatever matters, and take the result away as a file. Nothing here is a second
 * system — it is the same query over the same index through the same pure
 * functions, with the grouping passed in.
 */
export const dynamic = "force-dynamic";

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };

export default async function AdvancedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const breakdown = parseBreakdown(params);

  const convex = convexServer();
  if (!convex) return null;

  const [result, people] = await Promise.all([
    convex.query(api.analytics.breakdown, {
      from: period.from,
      to: period.to,
      by: breakdown.by,
      ...(breakdown.sort ? { sort: breakdown.sort } : {}),
    }),
    convex.query(api.analytics.people, { from: period.from, to: period.to }),
  ]);

  const locale = LOCALE[CONSOLE_LANG] ?? "en-US";
  const query = periodQuery(period);
  const base = "/office/resumen/avanzado";

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* The period rides the link back, so returning to the summary shows the
            same stretch of time this page was reading — not the default month. */}
        <Breadcrumb
          trail={[
            { label: tc("navSummary"), href: `/office/resumen?${query}` },
            { label: tc("crumbAdvanced") },
          ]}
        />
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{tc("advancedTitle")}</h1>
        <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">{tc("advancedHint")}</p>
      </div>

      <PeriodNav period={period} basePath={base} />

      {/* ---------------- The pivot ---------------- */}
      <section className="card flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
              {tc("groupBy")}
            </span>
            <nav aria-label={tc("groupBy")} className="flex flex-wrap gap-1.5">
              {DIMENSIONS.map((dimension) => {
                const current = breakdown.by === dimension;
                return (
                  <Link
                    key={dimension}
                    // Changing the grouping drops the sort: a column that was
                    // being sorted on still exists, but "the biggest week" and
                    // "the biggest client" are different questions, and keeping
                    // the old order would answer neither.
                    href={`${base}?${breakdownQuery(query, { by: dimension, sort: null })}`}
                    aria-current={current ? "true" : undefined}
                    className={`min-h-9 rounded-lg border-[1.5px] px-3 py-1.5 text-sm font-semibold transition ${
                      current
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                        : "border-[color:var(--line)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
                    }`}
                  >
                    {tc(DIMENSION_LABEL[dimension])}
                  </Link>
                );
              })}
            </nav>
          </div>

          <a
            href={`/api/office/export?${breakdownQuery(query, breakdown)}`}
            className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-1.5 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {tc("exportCsv")}
          </a>
        </div>

        {result.truncated && (
          <p className="notice text-sm">{tc("vizTruncated")}</p>
        )}

        <Pivot
          rows={result.rows}
          sort={breakdown.sort}
          hrefFor={(measure) =>
            `${base}?${breakdownQuery(query, breakdown, breakdown.sort === measure ? null : measure)}`
          }
          labelFor={(row) =>
            breakdown.by === "week" || breakdown.by === "day"
              ? shortDate(row.label, locale)
              : row.label || tc("unattributed")
          }
        />

        <p className="text-xs text-[color:var(--ink-muted)]">{tc("exportHint")}</p>
      </section>

      {/* ---------------- Hours by person ---------------- */}
      <section className="card flex flex-col gap-3 p-4 sm:p-5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">{tc("payrollTitle")}</h2>
          <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">{tc("payrollHint")}</p>
        </div>

        <div className="scroll-x -mx-1 px-1">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line)]">
                <Th>{tc("name")}</Th>
                <Th numeric>{tc("hours")}</Th>
                <Th numeric>{tc("colDaysWorked")}</Th>
                <Th numeric>{tc("colHoursMissing")}</Th>
              </tr>
            </thead>
            <tbody>
              {people.rows.map((person) => (
                <tr
                  key={`${person.personId ?? "adhoc"}:${person.name}`}
                  className="border-b border-[color:var(--line)] last:border-0"
                >
                  <td className="py-2 pr-4">
                    {person.personId ? (
                      <Link
                        href={`/office/personas/${encodeURIComponent(person.personId)}?from=${period.from}&to=${period.to}`}
                        className="font-medium transition hover:underline"
                      >
                        {person.name}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {person.name}
                        <span className="ml-2 text-xs font-normal italic text-[color:var(--ink-muted)]">
                          {tc("notOnRoster")}
                        </span>
                      </span>
                    )}
                  </td>
                  <Td>{hoursGrouped(person.hours)}</Td>
                  <Td>{person.daysWorked}</Td>
                  {/* The column payroll acts on. Zero is silent; anything else
                      is somebody who has to be asked before a cheque is cut.
                      With no hue left, the emphasis is the weight: a count sits
                      in full ink and bold, a dash recedes to muted. */}
                  <td
                    className={`py-2 pl-4 text-right tabular-nums ${
                      person.daysMissingHours > 0
                        ? "font-bold"
                        : "font-normal text-[color:var(--ink-muted)]"
                    }`}
                  >
                    {person.daysMissingHours > 0 ? person.daysMissingHours : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {people.rows.some((person) => person.adhoc) && (
          <p className="text-xs text-[color:var(--ink-muted)]">{tc("adhocNote")}</p>
        )}
      </section>

      {/* ---------------- What needs chasing ---------------- */}
      <Quality period={period} />
    </div>
  );
}

/**
 * The pivot.
 *
 * Every column header is a link that sorts by it, and the sort lands in the URL
 * like everything else — so "materials by client, biggest first" is a link, and
 * so is the CSV of it. Clicking the column that is already sorted clears the
 * sort rather than reversing it: descending is the only order any of these
 * measures is ever read in, and a second click that quietly showed the smallest
 * client would be answering a question nobody asked.
 */
function Pivot({
  rows,
  sort,
  hrefFor,
  labelFor,
}: {
  rows: GroupRow[];
  sort: Measure | null;
  hrefFor: (measure: Measure) => string;
  labelFor: (row: GroupRow) => string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-[color:var(--ink-muted)]">{tc("vizNoData")}</p>;
  }

  return (
    <div className="scroll-x -mx-1 px-1">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[color:var(--line)]">
            <Th>{tc("groupBy")}</Th>
            {MEASURES.map((measure) => (
              <th
                key={measure}
                scope="col"
                aria-sort={sort === measure ? "descending" : "none"}
                className="whitespace-nowrap py-2 pl-4 text-right text-xs font-semibold uppercase tracking-wide"
              >
                <Link
                  href={hrefFor(measure)}
                  className={`inline-flex items-center gap-1 rounded transition hover:text-[color:var(--ink)] ${
                    sort === measure
                      ? "text-[color:var(--ink)]"
                      : "text-[color:var(--ink-muted)]"
                  }`}
                >
                  {tc(MEASURE_LABEL[measure])}
                  {sort === measure && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 5v14m0 0l-6-6m6 6l6-6"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-[color:var(--line)] last:border-0">
              <td className="whitespace-nowrap py-2 pr-4 font-medium">{labelFor(row)}</td>
              {MEASURES.map((measure) => (
                <Td key={measure}>{show(row, measure)}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The value as the screen says it — the CSV says the same number, unformatted. */
function show(row: GroupRow, measure: Measure): string {
  const value = row[measure];
  // Not "0%": a share nobody could compute is a different fact from no driving.
  if (value === null) return "—";

  switch (MEASURE_FORMAT[measure]) {
    case "share":
      return `${Math.round(value * 100)}%`;
    case "money":
      return value >= 10_000 ? money(value) : moneyExact(value);
    case "hours":
      return hoursGrouped(value) ?? "0";
    default:
      return String(value);
  }
}

function Th({ children, numeric }: { children: React.ReactNode; numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)] ${
        numeric ? "pl-4 text-right" : "pr-4 text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2 pl-4 text-right font-semibold tabular-nums">{children}</td>;
}

/**
 * The office's to-do list, as links.
 *
 * Each one lands on the search that produced it, dates already filled in. A
 * count nobody can click is a count somebody has to reconstruct by hand, which
 * is how a screen like this stops being opened.
 */
function Quality({ period }: { period: { from: string; to: string } }) {
  const range = `from=${period.from}&to=${period.to}`;

  const links = [
    { label: tc("statusNeedsReview"), href: `/office/reportes?${range}&status=needs_review` },
    { label: tc("statusSubmitted"), href: `/office/reportes?${range}&status=submitted` },
    { label: tc("statusApproved"), href: `/office/reportes?${range}&status=approved` },
  ];

  return (
    <section className="card flex flex-col gap-3 p-4 sm:p-5">
      <div>
        <h2 className="text-[15px] font-bold tracking-tight">{tc("qualityTitle")}</h2>
        <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">{tc("qualityHint")}</p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="chip font-semibold transition hover:border-[color:var(--ink-muted)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
