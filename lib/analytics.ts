import { startOfWeek } from "./officeDate";
import { personKey } from "./summaries";
import type { ReportTotals } from "./submission";
import type { L10n } from "./types";

/**
 * What a month of reports adds up to.
 *
 * The day board answers "what happened today" and the search answers "where is
 * that report". This is the third question, the one a project manager actually
 * asks on a Friday: **where did the month go**. Everything here exists to answer
 * one of five questions that the paper form structurally cannot:
 *
 * 1. How much of the paid day is spent driving?
 * 2. What are the rentals costing us?
 * 3. How much came out of the yard, and how much did we buy?
 * 4. Which client is eating the hours?
 * 5. Who is filing, and who has been quiet?
 *
 * Two rules, inherited from `lib/summaries.ts` and non-negotiable here:
 *
 * - **Nothing is recomputed.** `totals` was worked out once at write time from
 *   `lib/calc.ts`. This adds those up. A number on a chart that disagreed with
 *   the PDF the foreman already sent would be worse than no chart.
 * - **No Convex import.** The query in `convex/analytics.ts` is a thin wrapper,
 *   and every rule below is testable without a deployment.
 *
 * One unit distinction runs through the whole file and is worth stating plainly,
 * because getting it wrong would make the headline chart a lie:
 *
 * - **Crew hours are person-hours.** Four men for eight hours is 32. This is
 *   what payroll pays and what `totals.crewHours` holds.
 * - **Day hours are one crew's day.** On site plus travel, once, regardless of
 *   how many people rode in the truck. This is `totals.onSiteHours` and
 *   `totals.travelHours`.
 *
 * They are never added together and never plotted on the same axis. The split
 * between on-site and travel is charted in day hours because that is the unit it
 * was measured in; spreading it across a crew would be an estimate wearing a
 * measurement's clothes.
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

/**
 * A report, as far as the roll-ups care.
 *
 * Structural rather than the stored document, so `Doc<"reports">` satisfies it
 * without this file knowing what a Convex document is.
 */
export type AnalyticsReport = {
  date: string;
  clientName: string;
  jobNumbers: string[];
  status: "submitted" | "needs_review" | "approved";
  flags: { key: string; field: string | null }[];
  submittedBy?: string;
  totals: ReportTotals;
  crew: { personId: string | null; name: string; hours: number | null }[];
  equipment: { id: string; label: L10n; owner: "BTN" | "RENTAL"; hours: number | null }[];
  materials: { id: string; label: L10n; source: "BTN" | "OTHER"; cost: number | null }[];
  plants: { cost: number | null }[];
};

/* ------------------------------------------------------------------ */
/* The headline numbers                                                */
/* ------------------------------------------------------------------ */

export type RangeTotals = {
  reports: number;
  /** Distinct people who appeared on any crew — a headcount, not a sum. */
  people: number;
  /** Person-hours. What payroll pays. */
  crewHours: number;
  /** Day hours: one crew's day, counted once. */
  onSiteHours: number;
  travelHours: number;
  /**
   * Travel as a share of the day, 0–1.
   *
   * The one number on this screen that is neither hours nor dollars, and the
   * most expensive fact in the system: an hour in the truck is paid at the same
   * rate as an hour laying stone and produces nothing.
   *
   * Null when no report in the range recorded all four times — a share computed
   * from two reports out of eighty would read as a fact about the month.
   */
  travelShare: number | null;
  materialsCost: number;
  yardCost: number;
  boughtCost: number;
  /**
   * What `materialsCost` holds that the line items do not explain.
   *
   * It should be zero and usually is. It is not always: `materialsCost` is the
   * total stored at write time, and a report whose lines were edited after the
   * fact — or filed by an older build — can carry a total its own rows no longer
   * add up to. Surfacing the remainder is the honest move; the alternative is a
   * split bar that quietly disagrees with the number above it and a project
   * manager who finds the gap in front of somebody.
   */
  unclassifiedCost: number;
  ownedHours: number;
  rentalHours: number;
};

export function rangeTotals(reports: AnalyticsReport[]): RangeTotals {
  const people = new Set<string>();
  let crewHours = 0;
  let onSiteHours = 0;
  let travelHours = 0;
  let timed = 0;
  let materialsCost = 0;
  let yardCost = 0;
  let boughtCost = 0;
  let ownedHours = 0;
  let rentalHours = 0;

  for (const report of reports) {
    for (const member of report.crew) people.add(personKey(member));
    crewHours += report.totals.crewHours;
    materialsCost += report.totals.materialsCost;

    // Both or neither: a report with on-site time and no travel time would
    // otherwise drag the share down as if that crew had teleported.
    if (report.totals.onSiteHours !== null && report.totals.travelHours !== null) {
      onSiteHours += report.totals.onSiteHours;
      travelHours += report.totals.travelHours;
      timed++;
    }

    for (const item of report.equipment) {
      const hours = item.hours ?? 0;
      if (item.owner === "RENTAL") rentalHours += hours;
      else ownedHours += hours;
    }

    for (const item of report.materials) {
      const cost = item.cost ?? 0;
      if (item.source === "OTHER") boughtCost += cost;
      else yardCost += cost;
    }

    // Plants are always bought — there is no nursery in the yard. They are part
    // of `materialsCost` already, so they only need splitting, not adding.
    for (const plant of report.plants) boughtCost += plant.cost ?? 0;
  }

  const day = onSiteHours + travelHours;

  return {
    reports: reports.length,
    people: people.size,
    crewHours: round2(crewHours),
    onSiteHours: round2(onSiteHours),
    travelHours: round2(travelHours),
    travelShare: timed > 0 && day > 0 ? travelHours / day : null,
    materialsCost: round2(materialsCost),
    yardCost: round2(yardCost),
    boughtCost: round2(boughtCost),
    unclassifiedCost: round2(materialsCost - yardCost - boughtCost),
    ownedHours: round2(ownedHours),
    rentalHours: round2(rentalHours),
  };
}

/* ------------------------------------------------------------------ */
/* A. The weeks                                                        */
/* ------------------------------------------------------------------ */

export type WeekBucket = {
  /** The Monday. Weeks start Monday because payroll does. */
  weekStart: string;
  reports: number;
  crewHours: number;
  onSiteHours: number;
  travelHours: number;
  materialsCost: number;
};

/**
 * The range, week by week, oldest first.
 *
 * Weeks with no reports are kept as empty buckets rather than dropped. A column
 * chart that silently closed the gap would show a quiet week as if it had never
 * existed, and a shut-down week is exactly the thing worth seeing.
 */
export function byWeek(reports: AnalyticsReport[], from: string, to: string): WeekBucket[] {
  const buckets = new Map<string, WeekBucket>();

  for (let week = startOfWeek(from); week <= to; week = shift(week, 7)) {
    buckets.set(week, {
      weekStart: week,
      reports: 0,
      crewHours: 0,
      onSiteHours: 0,
      travelHours: 0,
      materialsCost: 0,
    });
  }

  for (const report of reports) {
    const bucket = buckets.get(startOfWeek(report.date));
    if (!bucket) continue;
    bucket.reports++;
    bucket.crewHours += report.totals.crewHours;
    bucket.materialsCost += report.totals.materialsCost;
    if (report.totals.onSiteHours !== null && report.totals.travelHours !== null) {
      bucket.onSiteHours += report.totals.onSiteHours;
      bucket.travelHours += report.totals.travelHours;
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((bucket) => ({
      ...bucket,
      crewHours: round2(bucket.crewHours),
      onSiteHours: round2(bucket.onSiteHours),
      travelHours: round2(bucket.travelHours),
      materialsCost: round2(bucket.materialsCost),
    }));
}

/** Local so this file needs nothing from officeDate but `startOfWeek`. */
function shift(isoDate: string, days: number): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* B. Ours and everyone else's                                         */
/* ------------------------------------------------------------------ */

export type SplitItem = {
  id: string;
  label: L10n;
  /** Owned equipment hours, or yard material cost. */
  ours: number;
  /** Rental hours, or purchased cost. */
  theirs: number;
};

/** Equipment by item, the heaviest first, each split owned against rented. */
export function equipmentSplit(reports: AnalyticsReport[]): SplitItem[] {
  const items = new Map<string, SplitItem>();

  for (const report of reports) {
    for (const entry of report.equipment) {
      const item = items.get(entry.id) ?? { id: entry.id, label: entry.label, ours: 0, theirs: 0 };
      if (entry.owner === "RENTAL") item.theirs += entry.hours ?? 0;
      else item.ours += entry.hours ?? 0;
      items.set(entry.id, item);
    }
  }

  return rank(items);
}

/** Materials by item, most expensive first, each split yard against bought. */
export function materialSplit(reports: AnalyticsReport[]): SplitItem[] {
  const items = new Map<string, SplitItem>();

  for (const report of reports) {
    for (const entry of report.materials) {
      const item = items.get(entry.id) ?? { id: entry.id, label: entry.label, ours: 0, theirs: 0 };
      if (entry.source === "OTHER") item.theirs += entry.cost ?? 0;
      else item.ours += entry.cost ?? 0;
      items.set(entry.id, item);
    }
  }

  return rank(items);
}

/**
 * Only the machines that were rented, most hours first.
 *
 * A separate list rather than a filter on the ranked one, because ranking by
 * total buries them: the yard's own trimmer runs every day on every job and the
 * excavator that cost real money comes tenth. This is the list somebody can act
 * on — each row is an invoice.
 */
export function rentals(items: SplitItem[]): SplitItem[] {
  return items.filter((item) => item.theirs > 0).sort((a, b) => b.theirs - a.theirs);
}

function rank(items: Map<string, SplitItem>): SplitItem[] {
  return [...items.values()]
    .map((item) => ({ ...item, ours: round2(item.ours), theirs: round2(item.theirs) }))
    .filter((item) => item.ours + item.theirs > 0)
    .sort((a, b) => b.ours + b.theirs - (a.ours + a.theirs));
}

/* ------------------------------------------------------------------ */
/* C. The clients                                                      */
/* ------------------------------------------------------------------ */

export type ClientBucket = {
  clientName: string;
  jobNumbers: string[];
  reports: number;
  crewHours: number;
  materialsCost: number;
};

/**
 * Clients by the hours they consumed, heaviest first.
 *
 * Keyed on the trimmed, case-folded name, because "Weinstein Residence" and
 * "weinstein residence " are one client and two rows would make the ranking
 * wrong rather than merely untidy. The name shown is the first spelling seen.
 */
export function byClient(reports: AnalyticsReport[]): ClientBucket[] {
  const clients = new Map<string, ClientBucket & { jobs: Set<string> }>();

  for (const report of reports) {
    const key = report.clientName.trim().toLowerCase();
    if (!key) continue;

    const bucket = clients.get(key) ?? {
      clientName: report.clientName.trim(),
      jobNumbers: [],
      reports: 0,
      crewHours: 0,
      materialsCost: 0,
      jobs: new Set<string>(),
    };

    bucket.reports++;
    bucket.crewHours += report.totals.crewHours;
    bucket.materialsCost += report.totals.materialsCost;
    for (const job of report.jobNumbers) bucket.jobs.add(job);
    clients.set(key, bucket);
  }

  return [...clients.values()]
    .map(({ jobs, ...bucket }) => ({
      ...bucket,
      crewHours: round2(bucket.crewHours),
      materialsCost: round2(bucket.materialsCost),
      jobNumbers: [...jobs].sort(),
    }))
    .sort((a, b) => b.crewHours - a.crewHours);
}

/* ------------------------------------------------------------------ */
/* D. The month, day by day                                            */
/* ------------------------------------------------------------------ */

export type ForemanRef = { userId: string; name: string; crewMemberId: string | null };

export type CalendarCell = {
  date: string;
  /** Null when nothing was filed — the gap, which is the whole point. */
  crewHours: number | null;
  reports: number;
  flagged: boolean;
};

export type CalendarRow = {
  foreman: ForemanRef | null;
  cells: CalendarCell[];
  reports: number;
  crewHours: number;
};

/**
 * Every foreman against every day in the range.
 *
 * This is the one view no mailbox can produce, and the reason is structural: an
 * inbox can only show what arrived. A grid can show a hole.
 *
 * `days` is passed in rather than derived from the reports, because deriving it
 * would make a day nobody filed disappear — which is precisely the day worth
 * looking at. Sundays are excluded by the caller for the opposite reason: nobody
 * works Sunday, so a blank Sunday column would be five false alarms a week.
 *
 * Reports with no foreman on them are collected into one trailing row rather
 * than dropped. They are real work; they just cannot clear anybody.
 */
export function calendar(
  reports: AnalyticsReport[],
  days: string[],
  foremen: ForemanRef[]
): CalendarRow[] {
  const rows = new Map<string, CalendarRow>();

  const blank = (): CalendarCell[] =>
    days.map((date) => ({ date, crewHours: null, reports: 0, flagged: false }));

  for (const foreman of foremen) {
    rows.set(foreman.userId, { foreman, cells: blank(), reports: 0, crewHours: 0 });
  }

  const UNATTRIBUTED = "";
  const index = new Map(days.map((date, at) => [date, at]));

  for (const report of reports) {
    const key = report.submittedBy ?? UNATTRIBUTED;
    let row = rows.get(key);
    if (!row) {
      // A report filed by somebody who is not in the foreman list — an account
      // deleted after a PIN reset, or a manager who filed from a truck.
      row = { foreman: null, cells: blank(), reports: 0, crewHours: 0 };
      rows.set(key, row);
    }

    const at = index.get(report.date);
    if (at === undefined) continue;

    const cell = row.cells[at];
    cell.crewHours = round2((cell.crewHours ?? 0) + report.totals.crewHours);
    cell.reports++;
    if (report.flags.length > 0) cell.flagged = true;

    row.reports++;
    row.crewHours = round2(row.crewHours + report.totals.crewHours);
  }

  return (
    [...rows.values()]
      // An unattributed row with nothing in it is a row about a report that fell
      // outside `days` — a Sunday, most often. A foreman's empty row is a fact
      // worth drawing; an empty row for nobody is just a blank line.
      .filter((row) => row.foreman !== null || row.reports > 0)
      .sort((a, b) => {
        // Unattributed work sits at the bottom: it is a footnote about the data,
        // not a person whose week you can go and look at.
        if (!a.foreman) return 1;
        if (!b.foreman) return -1;
        return a.foreman.name.localeCompare(b.foreman.name);
      })
  );
}

/* ------------------------------------------------------------------ */
/* Deltas                                                              */
/* ------------------------------------------------------------------ */

/**
 * The change against the period before, as a share.
 *
 * Null rather than infinity when the previous period was empty: "up ∞%" from a
 * week the company was shut is not a number anyone should be shown, and "up
 * 100%" would be worse because it looks like one.
 */
export function delta(now: number, before: number): number | null {
  if (before === 0) return null;
  return (now - before) / before;
}

/* ------------------------------------------------------------------ */
/* Advanced — the same roll-up with the axis loose                     */
/* ------------------------------------------------------------------ */

/**
 * What the advanced screen can put on the rows.
 *
 * `person` is deliberately not one of them. Everything here is measured per
 * report — a report has a client, a foreman, a date — and a person does not have
 * a materials cost or a travel time of their own. Splitting a crew's day five
 * ways to give each man a share of the diesel would be an estimate presented as
 * a measurement. People get their own screen, built from `crewDays`, where the
 * only measure is the one that was actually written down: hours.
 */
export type Dimension = "week" | "day" | "client" | "foreman";

export type GroupRow = {
  key: string;
  label: string;
  reports: number;
  crewHours: number;
  onSiteHours: number;
  travelHours: number;
  /** Null when no report in the group recorded all four times. */
  travelShare: number | null;
  materialsCost: number;
  yardCost: number;
  boughtCost: number;
  ownedHours: number;
  rentalHours: number;
};

export type Measure = Exclude<keyof GroupRow, "key" | "label">;

/**
 * The same numbers as the summary, grouped by whatever is being asked about.
 *
 * Built on `rangeTotals` rather than beside it, so a row in this table and the
 * tile at the top of the summary can never be computed by two different rules
 * that drift apart.
 */
export function groupBy(
  reports: AnalyticsReport[],
  dimension: Dimension,
  nameOf: (userId: string) => string
): GroupRow[] {
  const groups = new Map<string, { label: string; rows: AnalyticsReport[] }>();

  for (const report of reports) {
    const { key, label } = bucketOf(report, dimension, nameOf);
    const group = groups.get(key) ?? { label, rows: [] };
    group.rows.push(report);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, group]) => {
    const totals = rangeTotals(group.rows);
    return {
      key,
      label: group.label,
      reports: totals.reports,
      crewHours: totals.crewHours,
      onSiteHours: totals.onSiteHours,
      travelHours: totals.travelHours,
      travelShare: totals.travelShare,
      materialsCost: totals.materialsCost,
      yardCost: totals.yardCost,
      boughtCost: totals.boughtCost,
      ownedHours: totals.ownedHours,
      rentalHours: totals.rentalHours,
    };
  });
}

function bucketOf(
  report: AnalyticsReport,
  dimension: Dimension,
  nameOf: (userId: string) => string
): { key: string; label: string } {
  switch (dimension) {
    case "week": {
      const start = startOfWeek(report.date);
      return { key: start, label: start };
    }
    case "day":
      return { key: report.date, label: report.date };
    case "client": {
      // Folded the same way `byClient` folds it, so the two screens cannot
      // disagree about how many clients there are.
      const name = report.clientName.trim();
      return { key: name.toLowerCase() || "—", label: name || "—" };
    }
    case "foreman": {
      if (!report.submittedBy) return { key: "", label: "" };
      return { key: report.submittedBy, label: nameOf(report.submittedBy) };
    }
  }
}

/**
 * Rows in the order the reader asked for.
 *
 * Descending by default because every measure here is a quantity, and the
 * question is always "which is the biggest". The two dimensions that are dates
 * are the exception: a week ordered by size is a table nobody can read as a
 * sequence, so those sort by their own key ascending unless told otherwise.
 */
export function sortRows(
  rows: GroupRow[],
  measure: Measure | null,
  dimension: Dimension
): GroupRow[] {
  const out = [...rows];

  if (measure === null) {
    const chronological = dimension === "week" || dimension === "day";
    return out.sort((a, b) =>
      chronological ? a.key.localeCompare(b.key) : b.crewHours - a.crewHours
    );
  }

  return out.sort((a, b) => {
    const left = a[measure];
    const right = b[measure];
    // A null share sorts last rather than as zero: "nobody wrote the times down"
    // is not the same finding as "nobody drove anywhere".
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left;
  });
}

/* ------------------------------------------------------------------ */
/* Payroll — hours by person                                           */
/* ------------------------------------------------------------------ */

/** A crew row, as far as the payroll roll-up cares. */
export type PayrollRow = {
  personId: string | null;
  name: string;
  date: string;
  hours: number | null;
  adhoc: boolean;
};

export type PersonTotal = {
  personId: string | null;
  name: string;
  hours: number;
  /** Distinct days this person was on somebody's crew. */
  daysWorked: number;
  /** Days they were on a crew and nobody wrote the hours down. */
  daysMissingHours: number;
  adhoc: boolean;
};

/**
 * What each person was written down for over the range.
 *
 * The screen payroll needs before it pays anybody, and the reason it is built
 * from `crewDays` rather than from the reports: a person is on a crew, and crew
 * lives inside a report as a nested array no index can reach into.
 *
 * `daysMissingHours` is the column that matters. A row whose hours look
 * plausible and whose second number is not zero is a row somebody has to go and
 * ask about — and the sum above it is smaller than the truth, not larger, which
 * is exactly the direction that gets noticed too late.
 *
 * Names a foreman wrote in have no roster id, so they collapse on the name.
 * Two crews that both wrote "Juan" become one row here. That is the wrong answer
 * when they are two men, and it is still the better error: the alternative
 * invents a new person every time the same name is typed, and none of them ever
 * merge.
 */
export function payroll(rows: PayrollRow[]): PersonTotal[] {
  const people = new Map<
    string,
    { total: PersonTotal; days: Map<string, boolean> }
  >();

  for (const row of rows) {
    const key = personKey(row);
    const found = people.get(key) ?? {
      total: {
        personId: row.personId,
        name: row.name,
        hours: 0,
        daysWorked: 0,
        daysMissingHours: 0,
        adhoc: row.adhoc,
      },
      days: new Map<string, boolean>(),
    };

    found.total.hours += row.hours ?? 0;
    // Two jobs in one day is one day worked. A day counts as recorded the moment
    // any one of its rows carries hours.
    found.days.set(row.date, (found.days.get(row.date) ?? false) || row.hours !== null);
    people.set(key, found);
  }

  return [...people.values()]
    .map(({ total, days }) => ({
      ...total,
      hours: round2(total.hours),
      daysWorked: days.size,
      daysMissingHours: [...days.values()].filter((recorded) => !recorded).length,
    }))
    .sort((a, b) => b.hours - a.hours);
}

/* ------------------------------------------------------------------ */
/* Data quality — what the office still has to chase                   */
/* ------------------------------------------------------------------ */

export type Outstanding = {
  needsReview: number;
  missingHours: number;
  unattributed: number;
  longDays: number;
  noCrew: number;
};

/**
 * The pile of things somebody has to do something about.
 *
 * Counted from the flags stored at write time, never re-derived — a report is
 * flagged for what it was when it was sent, even if the rules moved since.
 */
export function outstanding(reports: AnalyticsReport[]): Outstanding {
  let needsReview = 0;
  let missingHours = 0;
  let unattributed = 0;
  let longDays = 0;
  let noCrew = 0;

  for (const report of reports) {
    if (report.status === "needs_review") needsReview++;
    if (!report.submittedBy) unattributed++;
    for (const flag of report.flags) {
      if (flag.key === "warnNoHours") missingHours++;
      if (flag.key === "warnLongDay") longDays++;
      if (flag.key === "warnNoCrew") noCrew++;
    }
  }

  return { needsReview, missingHours, unattributed, longDays, noCrew };
}
