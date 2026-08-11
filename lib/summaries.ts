import type { CrewDayRow, ReportTotals } from "./submission";

/**
 * What the office reads, worked out from what the phone already wrote.
 *
 * Deliberately free of any Convex import, for the same reason `submission.ts`
 * is: the queries in `convex/office.ts` stay thin wrappers, and every rule here —
 * what counts as a person on site, who counts as missing, what a week adds up
 * to — is unit-testable without a deployment.
 *
 * Nothing in this file recomputes a total. `reports.totals` was worked out once
 * at write time from `lib/calc.ts`, and the console adds those up rather than
 * running the arithmetic again: a number here that disagreed with the PDF the
 * foreman already sent would be worse than no number at all.
 */

/** Money, to the cent. Summing floats drifts; the office reads these as dollars. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* The day                                                             */
/* ------------------------------------------------------------------ */

/** Only what the four numbers need — any row with these fields will do. */
export type DayReport = {
  totals: ReportTotals;
  crew: { personId: string | null; name: string }[];
};

export type DaySummary = {
  /** Reports received. One report is one crew's day. */
  reports: number;
  /**
   * Distinct people on site.
   *
   * Not "crews out", which the plan first asked for — a crew's day *is* a
   * report, so that number would have been the report count printed twice.
   */
  people: number;
  crewHours: number;
  materialsCost: number;
};

/**
 * Identifies a person across reports.
 *
 * Roster people carry an id and collapse exactly. A name the foreman typed in
 * has none, so it collapses on the name itself: two crews that both wrote
 * "Juan" are counted once. That is the wrong answer when they are two different
 * Juans, and it is still the better error — the alternative counts one man twice
 * on a headcount the office reads as how many people were out today.
 */
export function personKey(member: { personId: string | null; name: string }): string {
  if (member.personId) return `id:${member.personId}`;
  return `name:${member.name.trim().toLowerCase()}`;
}

export function summariseDay(reports: DayReport[]): DaySummary {
  const people = new Set<string>();
  let crewHours = 0;
  let materialsCost = 0;

  for (const report of reports) {
    for (const member of report.crew) people.add(personKey(member));
    crewHours += report.totals.crewHours;
    materialsCost += report.totals.materialsCost;
  }

  return {
    reports: reports.length,
    people: people.size,
    crewHours: round2(crewHours),
    materialsCost: round2(materialsCost),
  };
}

/* ------------------------------------------------------------------ */
/* Who did not send one                                                */
/* ------------------------------------------------------------------ */

export type Foreman = {
  userId: string;
  name: string;
  crewMemberId: string;
};

/**
 * The foremen who filed nothing.
 *
 * This is the screen the console exists for, and it has one honest limit worth
 * stating plainly: a foreman can only be missing if he enrolled. Someone who
 * never set his PIN has no account, so nothing here can tell whether he worked
 * today and skipped the report or was simply not on the schedule. The office
 * sees who is set up and silent, not who is absent from the world.
 *
 * There is no shift data in this system, so "had a shift today" is not a
 * question that can be asked yet. Everyone enrolled is expected to file.
 */
export function missingForemen<T extends Foreman>(
  enrolled: T[],
  filedBy: Iterable<string>
): T[] {
  const filed = new Set<string>(filedBy);
  return enrolled
    .filter((foreman) => !filed.has(foreman.userId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ */
/* One person's week                                                   */
/* ------------------------------------------------------------------ */

/**
 * A crew row, as far as the roll-up cares.
 *
 * Generic over the row so the stored document — which carries `_id` and the
 * `reportId` the console links to — passes through to `entries` intact, rather
 * than being flattened to the shape the phone sent.
 */
export type WeekRow = { date: string; hours: number | null };

export type PersonDay<T extends WeekRow = CrewDayRow> = {
  date: string;
  /** Null when nobody wrote the hours down — which is not the same as zero. */
  hours: number | null;
  entries: T[];
};

export type PersonWeek<T extends WeekRow = CrewDayRow> = {
  /** Oldest first, so a week reads left to right. Days off are simply absent. */
  days: PersonDay<T>[];
  totalHours: number;
  daysWorked: number;
  /**
   * Days he was on a crew with no hours recorded. Payroll cannot pay from this
   * week until it is zero, so the number is worth more than the silence.
   */
  daysMissingHours: number;
};

export function rollUpPersonWeek<T extends WeekRow>(rows: T[]): PersonWeek<T> {
  const byDate = new Map<string, T[]>();
  for (const row of rows) {
    const existing = byDate.get(row.date);
    if (existing) existing.push(row);
    else byDate.set(row.date, [row]);
  }

  const days: PersonDay<T>[] = [...byDate.entries()]
    // `date` is YYYY-MM-DD, so lexical order is chronological order.
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => {
      const recorded = entries.filter((entry) => entry.hours !== null);
      return {
        date,
        // A day of nothing but blanks stays null rather than becoming a
        // confident zero. Two jobs in one day add up.
        hours:
          recorded.length > 0
            ? round2(recorded.reduce((sum, entry) => sum + (entry.hours ?? 0), 0))
            : null,
        entries,
      };
    });

  return {
    days,
    totalHours: round2(days.reduce((sum, day) => sum + (day.hours ?? 0), 0)),
    daysWorked: days.length,
    daysMissingHours: days.filter((day) => day.hours === null).length,
  };
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/**
 * The filters an index cannot answer.
 *
 * Date and status come off `by_date` / `by_status_date` before a document is
 * read. These three are checked afterwards, on the rows those indexes already
 * narrowed to. Free text over the description is deliberately not here — that
 * needs a Convex search index, and it is its own decision.
 */
export type ReportFilter = {
  /** Substring, case-insensitive: nobody types a client's name the same way twice. */
  clientName?: string;
  /** Exact, against any job number on the report. A job number is an identifier. */
  jobNumber?: string;
  submittedBy?: string;
  /** One thing wrong with the report — see `ISSUE_FLAG`. */
  issue?: SearchIssue;
};

/**
 * The four things the summary counts as outstanding, as one filter.
 *
 * They are one filter rather than four because they answer one question — "what
 * is wrong with it" — and a project manager picks exactly one at a time. Three
 * of them are soft checks the phone ran and stored on the report; the fourth is
 * the absence of a foreman, which is not a flag but reads as the same kind of
 * problem to the person looking for it.
 *
 * This exists so the counts on the summary can be links. A number a PM cannot
 * click is a number they have to go and reconstruct by hand, and the console
 * knew there were twelve reports missing hours while offering no way to see
 * them.
 */
export const SEARCH_ISSUES = ["noHours", "longDay", "noCrew", "unattributed"] as const;
export type SearchIssue = (typeof SEARCH_ISSUES)[number];

/** Which stored flag key each issue is asking about. `unattributed` is not one. */
const ISSUE_FLAG: Record<SearchIssue, string | null> = {
  noHours: "warnNoHours",
  longDay: "warnLongDay",
  noCrew: "warnNoCrew",
  unattributed: null,
};

export type FilterableReport = {
  clientName: string;
  jobNumbers: string[];
  submittedBy?: string;
  /** As stored at write time — the warnings the foreman's phone actually sent. */
  flags?: { key: string }[];
};

export function matchesFilter(report: FilterableReport, filter: ReportFilter): boolean {
  const clientName = filter.clientName?.trim().toLowerCase();
  if (clientName && !report.clientName.toLowerCase().includes(clientName)) return false;

  const jobNumber = filter.jobNumber?.trim().toLowerCase();
  if (jobNumber && !report.jobNumbers.some((n) => n.trim().toLowerCase() === jobNumber)) {
    return false;
  }

  if (filter.submittedBy && report.submittedBy !== filter.submittedBy) return false;

  if (filter.issue) {
    const wanted = ISSUE_FLAG[filter.issue];

    if (wanted === null) {
      // "No foreman" is the absence of a field, not the presence of a flag.
      if (report.submittedBy) return false;
    } else if (!(report.flags ?? []).some((flag) => flag.key === wanted)) {
      return false;
    }
  }

  return true;
}
