import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import { CONSOLE_LANG, tc, tcf } from "@/lib/i18n";
import { delta } from "@/lib/analytics";
import { shortDate } from "@/lib/officeDate";
import { parsePeriod, periodQuery, previousPeriod } from "@/lib/officePeriod";
import { hoursGrouped, money, moneyExact } from "@/lib/officeFormat";
import { PeriodNav } from "@/components/office/PeriodNav";
import { Check, Chevron } from "@/components/office/icons";
import { ChartCard } from "@/components/office/charts/Card";
import { StatTile } from "@/components/office/charts/StatTile";
import { StackedColumns } from "@/components/office/charts/StackedColumns";
import { RankedBars } from "@/components/office/charts/RankedBars";
import { SplitBar } from "@/components/office/charts/SplitBar";
import { Heatmap } from "@/components/office/charts/Heatmap";

/**
 * The summary.
 *
 * The day board answers "what happened today" and the search answers "where is
 * that report". Both are questions about one day or one report. This is the
 * third question, and the one a project manager actually asks on a Friday:
 * **where did the month go?**
 *
 * Five numbers, then four charts, in the order the questions get asked. Every
 * one of them answers something the paper form structurally cannot — not
 * because the data was missing, but because nobody can read two hundred sheets
 * at once.
 *
 * Never cached, for the same reason the day board is not: a summary from a
 * minute ago is the answer to a different question, and reports land all
 * evening.
 */
export const dynamic = "force-dynamic";

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };
const TOP_CLIENTS = 8;

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const before = previousPeriod(period);

  const convex = convexServer();
  // The layout's gate already refuses to render this without a deployment, so
  // reaching here with none would be a bug rather than a state.
  if (!convex) return null;

  // Two reads of the same shape: the deltas on every tile are measured against
  // the stretch of identical length immediately before, and asking for it
  // separately keeps the query simple enough to stay one indexed range each.
  const [now, then] = await Promise.all([
    convex.query(api.analytics.overview, { from: period.from, to: period.to }),
    convex.query(api.analytics.overview, { from: before.from, to: before.to }),
  ]);

  const locale = LOCALE[CONSOLE_LANG] ?? "en-US";
  const t = now.totals;
  const p = then.totals;

  const hrs = (n: number) => hoursGrouped(n) ?? "0";
  const week = (iso: string) => shortDate(iso, locale);

  /** The share of the day spent driving, as the chart and the table both say it. */
  const drivingShare = (onSite: number, travel: number): string | null => {
    const day = onSite + travel;
    return day > 0 ? `${Math.round((travel / day) * 100)}%` : null;
  };

  const lastWeek = now.weeks.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{tc("summaryTitle")}</h1>
        <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">{tc("summaryHint")}</p>
      </div>

      <PeriodNav period={period} basePath="/office/resumen" />

      {/* Said out loud rather than trimmed in silence — charts drawn from part
          of the data would answer a different question than the one asked. */}
      {now.truncated && (
        <p className="notice text-sm">{tc("vizTruncated")}</p>
      )}

      {/* ---------------- The five numbers ---------------- */}
      <section aria-label={tc("summaryTitle")}>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label={tc("kpiLabour")}
            value={hrs(t.crewHours)}
            hint={tc("kpiLabourHint")}
            delta={delta(t.crewHours, p.crewHours)}
            emphasis
          />
          <StatTile
            label={tc("kpiTravel")}
            value={t.travelShare === null ? "—" : `${Math.round(t.travelShare * 100)}%`}
            hint={tc("kpiTravelHint")}
            delta={
              t.travelShare === null || p.travelShare === null
                ? null
                : delta(t.travelShare, p.travelShare)
            }
            // More of the paid day spent in the truck is never good news.
            direction="up-bad"
          />
          <StatTile
            label={tc("kpiRental")}
            value={hrs(t.rentalHours)}
            hint={tc("kpiRentalHint")}
            delta={delta(t.rentalHours, p.rentalHours)}
            direction="up-bad"
          />
          <StatTile
            label={tc("kpiMaterials")}
            value={money(t.materialsCost)}
            hint={tc("kpiMaterialsHint")}
            delta={delta(t.materialsCost, p.materialsCost)}
          />
          <StatTile
            label={tc("kpiReports")}
            value={String(t.reports)}
            hint={tc("kpiReportsHint")}
            delta={delta(t.reports, p.reports)}
            direction="up-good"
          />
        </dl>
      </section>

      <Outstanding counts={now.outstanding} period={period} />

      {/* ---------------- A. Where the day goes ---------------- */}
      <ChartCard
        title={tc("chartHours")}
        subtitle={tc("chartHoursHint")}
        legend={[
          { tone: "ours", label: tc("seriesOnSite") },
          { tone: "theirs", label: tc("seriesTravel") },
        ]}
        table={{
          head: [
            tc("colWeek"),
            tc("colReports"),
            tc("colOnSite"),
            tc("colTravel"),
            tc("colShare"),
            tc("colCrewHours"),
          ],
          numeric: [1, 2, 3, 4, 5],
          rows: now.weeks.map((w) => [
            week(w.weekStart),
            w.reports,
            hrs(w.onSiteHours),
            hrs(w.travelHours),
            drivingShare(w.onSiteHours, w.travelHours) ?? "—",
            hrs(w.crewHours),
          ]),
        }}
      >
        <StackedColumns
          columns={now.weeks.map((w, at) => ({
            key: w.weekStart,
            label: week(w.weekStart),
            ours: w.onSiteHours,
            theirs: w.travelHours,
            // Only the last column carries a printed number. Six percentages
            // that all read "about 17%" is the chart shouting its own axis at
            // the reader; one on the endpoint says where the month landed, and
            // the rest are a shape you compare it against. The table below has
            // every one of them.
            cap: at === lastWeek ? (drivingShare(w.onSiteHours, w.travelHours) ?? undefined) : undefined,
            tip: `${week(w.weekStart)} · ${tc("seriesOnSite")} ${hrs(w.onSiteHours)} · ${tc("seriesTravel")} ${hrs(w.travelHours)} · ${w.reports} ${tc("colReports").toLowerCase()}`,
          }))}
        />
      </ChartCard>

      {/* ---------------- B. Ours and everyone else's ---------------- */}
      <ChartCard
        title={tc("chartSplit")}
        subtitle={tc("chartSplitHint")}
        table={{
          head: [tc("colItem"), tc("colOurs"), tc("colTheirs")],
          numeric: [1, 2],
          rows: [
            ...now.equipment.map((item) => [
              item.label[CONSOLE_LANG],
              hrs(item.ours),
              hrs(item.theirs),
            ]),
            ...now.materials.map((item) => [
              item.label[CONSOLE_LANG],
              moneyExact(item.ours),
              moneyExact(item.theirs),
            ]),
          ],
        }}
      >
        <div className="flex flex-col gap-5">
          <SplitBar
            split={{
              label: tc("splitEquipment"),
              oursLabel: tc("seriesOwned"),
              theirsLabel: tc("seriesRented"),
              ours: t.ownedHours,
              theirs: t.rentalHours,
              totalLabel: `${hrs(t.ownedHours + t.rentalHours)} ${tc("hours")}`,
            }}
          />
          <SplitBar
            split={{
              label: tc("splitMaterials"),
              oursLabel: tc("seriesYard"),
              theirsLabel: tc("seriesBought"),
              ours: t.yardCost,
              theirs: t.boughtCost,
              totalLabel: money(t.yardCost + t.boughtCost),
            }}
          />

          {/* The honest remainder. `materialsCost` is the total stored at write
              time; a report whose lines were edited afterwards can carry a total
              its own rows no longer explain. Better said than quietly absorbed
              into one of the two halves. */}
          {Math.abs(t.unclassifiedCost) >= 0.01 && (
            <p className="text-xs text-[color:var(--ink-muted)]">
              {tcf("splitUnclassified", { amount: moneyExact(t.unclassifiedCost) })}
            </p>
          )}
        </div>
      </ChartCard>

      {/* ---------------- The rentals, listed ---------------- */}
      <ChartCard
        title={tc("chartRentals")}
        subtitle={tc("chartRentalsHint")}
        table={{
          head: [tc("colItem"), tc("colTheirs")],
          numeric: [1],
          rows: now.rentals.map((item) => [item.label[CONSOLE_LANG], hrs(item.theirs)]),
        }}
      >
        <RankedBars
          tone="theirs"
          bars={now.rentals.map((item) => ({
            key: item.id,
            label: item.label[CONSOLE_LANG],
            value: item.theirs,
            valueLabel: `${hrs(item.theirs)} ${tc("hours")}`,
            tip: `${item.label[CONSOLE_LANG]} · ${hrs(item.theirs)} ${tc("hours")} ${tc("seriesRented").toLowerCase()}`,
          }))}
        />
      </ChartCard>

      {/* ---------------- C. The clients ---------------- */}
      <ChartCard
        title={tc("chartClients")}
        subtitle={tc("chartClientsHint")}
        table={{
          head: [tc("colClient"), tc("colJobs"), tc("colReports"), tc("colCrewHours"), tc("colCost")],
          numeric: [2, 3, 4],
          rows: now.clients.map((client) => [
            client.clientName,
            client.jobNumbers.join(" · ") || "—",
            client.reports,
            hrs(client.crewHours),
            moneyExact(client.materialsCost),
          ]),
        }}
      >
        <RankedBars
          bars={now.clients.slice(0, TOP_CLIENTS).map((client) => ({
            key: client.clientName,
            label: client.clientName,
            meta: client.jobNumbers.length > 0 ? `#${client.jobNumbers.join(" · ")}` : undefined,
            value: client.crewHours,
            valueLabel: `${hrs(client.crewHours)} ${tc("hours")}`,
            tip: `${client.clientName} · ${client.reports} ${tc("colReports").toLowerCase()} · ${moneyExact(client.materialsCost)} ${tc("kpiMaterials").toLowerCase()}`,
          }))}
        />
      </ChartCard>

      {/* ---------------- D. The period, day by day ---------------- */}
      <ChartCard
        title={tc("chartCalendar")}
        subtitle={tc("chartCalendarHint")}
        table={{
          head: [tc("colForeman"), tc("colDaysFiled"), tc("colDaysMissed"), tc("colCrewHours")],
          numeric: [1, 2, 3],
          rows: now.calendar.map((row) => [
            row.foreman?.name ?? tc("unattributed"),
            row.cells.filter((cell) => cell.crewHours !== null).length,
            row.cells.filter((cell) => cell.crewHours === null).length,
            hrs(row.crewHours),
          ]),
        }}
      >
        <Heatmap
          days={now.days}
          locale={locale}
          formatHours={(n) => hrs(n)}
          rows={now.calendar.map((row) => ({
            name: row.foreman?.name ?? tc("unattributed"),
            crewMemberId: row.foreman?.crewMemberId ?? null,
            cells: row.cells,
          }))}
        />
      </ChartCard>

      <Link
        href={`/office/resumen/avanzado?${periodQuery(period)}`}
        className="card press flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-bold tracking-tight">{tc("advancedTitle")}</span>
          <span className="mt-0.5 block text-sm text-[color:var(--ink-muted)]">
            {tc("advancedHint")}
          </span>
        </span>
        <Chevron className="shrink-0" />
      </Link>
    </div>
  );
}

/**
 * The pile the office still has to do something about.
 *
 * Every count is a link into the search that produced it, with the dates already
 * filled in — a number a project manager cannot click is a number they have to
 * go and reconstruct by hand, which is how a dashboard stops being used.
 */
function Outstanding({
  counts,
  period,
}: {
  counts: {
    needsReview: number;
    missingHours: number;
    unattributed: number;
    longDays: number;
    noCrew: number;
  };
  period: { from: string; to: string };
}) {
  const range = `from=${period.from}&to=${period.to}`;

  // All five, not one. Four of these used to be plain text because the search
  // had no filter that could answer them — which meant the console knew there
  // were twelve reports missing somebody's hours and offered no way to see
  // which twelve. The `issue` filter exists for exactly this.
  const items = [
    {
      n: counts.needsReview,
      label: tc("outNeedsReview"),
      href: `/office/reportes?${range}&status=needs_review`,
    },
    {
      n: counts.missingHours,
      label: tc("outMissingHours"),
      href: `/office/reportes?${range}&issue=noHours`,
    },
    { n: counts.longDays, label: tc("outLongDays"), href: `/office/reportes?${range}&issue=longDay` },
    { n: counts.noCrew, label: tc("outNoCrew"), href: `/office/reportes?${range}&issue=noCrew` },
    {
      n: counts.unattributed,
      label: tc("outUnattributed"),
      href: `/office/reportes?${range}&issue=unattributed`,
    },
  ].filter((item) => item.n > 0);

  return (
    <section className={`card p-4 sm:p-5 ${items.length > 0 ? "card-attention" : ""}`}>
      <h2 className="text-[15px] font-bold tracking-tight">{tc("outstandingTitle")}</h2>

      {items.length === 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[color:var(--ink-muted)]">
          <Check />
          {tc("outstandingNone")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="chip font-semibold transition hover:border-[color:var(--ink-muted)]"
              >
                <span className="font-bold tabular-nums">{item.n}</span>
                <span className="text-[color:var(--ink-muted)]">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
