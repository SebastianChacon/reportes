import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { l10n } from "./validators";
import { workdays } from "../lib/officeDate";
import {
  byClient,
  byWeek,
  calendar,
  equipmentSplit,
  groupBy,
  materialSplit,
  outstanding,
  payroll,
  rangeTotals,
  rentals,
  sortRows,
  type Dimension,
  type ForemanRef,
  type Measure,
} from "../lib/analytics";

/**
 * What the summary screen reads.
 *
 * One query for one date range, deliberately: every chart on `/office/resumen`
 * describes the same slice of time, so they all have to come out of the same
 * read or two of them will disagree on a Friday afternoon while reports are
 * still landing.
 *
 * The rules from `convex/office.ts` hold here too — nothing is recomputed, and
 * the read goes through `by_date`. What is new is a cap that matters more: a
 * summary is asked about a quarter as easily as a week, and "the whole year" is
 * a legal range somebody will type. The scan is bounded and says so.
 */

/**
 * Enough for a year of five crews working six days a week, and a hard stop well
 * before a query that would time out. `truncated` is reported rather than
 * swallowed: a chart drawn from half the data is worse than one that says so.
 */
const MAX_SCAN = 2_500;

/** How many rows the ranked lists hand back. The rest live in the table view. */
const TOP_N = 10;

const splitItem = v.object({
  id: v.string(),
  label: l10n,
  ours: v.number(),
  theirs: v.number(),
});

const foremanRef = v.object({
  userId: v.string(),
  name: v.string(),
  crewMemberId: v.union(v.string(), v.null()),
});

/**
 * Everyone a row in the heat map could belong to.
 *
 * Wider than "the enrolled foremen": a manager who filed from a truck is in the
 * data whether or not he is on a roster, and a grid that could not draw him
 * would lose his reports. Narrower than "everyone with an account": an office
 * account that never filed anything would be an empty row forever, which reads
 * as a person who stopped working.
 */
function foremenFor(users: Doc<"users">[], filed: Set<string>): ForemanRef[] {
  return users
    .filter((user) => (user.role === "foreman" && user.crewMemberId) || filed.has(user._id))
    .map((user) => ({
      userId: user._id as string,
      name: user.name,
      crewMemberId: user.crewMemberId ?? null,
    }));
}

export const overview = query({
  args: { from: v.string(), to: v.string() },
  returns: v.object({
    from: v.string(),
    to: v.string(),
    truncated: v.boolean(),

    totals: v.object({
      reports: v.number(),
      people: v.number(),
      crewHours: v.number(),
      onSiteHours: v.number(),
      travelHours: v.number(),
      travelShare: v.union(v.number(), v.null()),
      materialsCost: v.number(),
      yardCost: v.number(),
      boughtCost: v.number(),
      unclassifiedCost: v.number(),
      ownedHours: v.number(),
      rentalHours: v.number(),
    }),

    weeks: v.array(
      v.object({
        weekStart: v.string(),
        reports: v.number(),
        crewHours: v.number(),
        onSiteHours: v.number(),
        travelHours: v.number(),
        materialsCost: v.number(),
      })
    ),

    equipment: v.array(splitItem),
    /** Only what was rented, hours first. Every row here is an invoice. */
    rentals: v.array(splitItem),
    materials: v.array(splitItem),

    clients: v.array(
      v.object({
        clientName: v.string(),
        jobNumbers: v.array(v.string()),
        reports: v.number(),
        crewHours: v.number(),
        materialsCost: v.number(),
      })
    ),

    days: v.array(v.string()),
    calendar: v.array(
      v.object({
        foreman: v.union(foremanRef, v.null()),
        reports: v.number(),
        crewHours: v.number(),
        cells: v.array(
          v.object({
            date: v.string(),
            crewHours: v.union(v.number(), v.null()),
            reports: v.number(),
            flagged: v.boolean(),
          })
        ),
      })
    ),

    outstanding: v.object({
      needsReview: v.number(),
      missingHours: v.number(),
      unattributed: v.number(),
      longDays: v.number(),
      noCrew: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const scanned = await ctx.db
      .query("reports")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .take(MAX_SCAN + 1);

    const truncated = scanned.length > MAX_SCAN;
    const reports = scanned.slice(0, MAX_SCAN);

    // The whole table, like `office.missingToday`: one row per person who has
    // ever enrolled, bounded by the size of the company, and no index answers
    // "everyone" anyway.
    const users = await ctx.db.query("users").collect();
    const filed = new Set<string>(
      reports.flatMap((report) => (report.submittedBy ? [report.submittedBy as string] : []))
    );

    // Structurally compatible with `AnalyticsReport` — the roll-ups are written
    // against a shape, not against a Convex document, which is what lets every
    // rule in `lib/analytics.ts` be tested without a deployment.
    const rows = reports.map((report) => ({ ...report, submittedBy: report.submittedBy as string }));
    const equipment = equipmentSplit(rows);
    const days = workdays(args.from, args.to);

    return {
      from: args.from,
      to: args.to,
      truncated,
      totals: rangeTotals(rows),
      weeks: byWeek(rows, args.from, args.to),
      equipment: equipment.slice(0, TOP_N),
      rentals: rentals(equipment).slice(0, TOP_N),
      materials: materialSplit(rows).slice(0, TOP_N),
      clients: byClient(rows).slice(0, TOP_N),
      days,
      calendar: calendar(rows, days, foremenFor(users, filed)),
      outstanding: outstanding(rows),
    };
  },
});

/* ------------------------------------------------------------------ */
/* /office/resumen/avanzado — the axis loose                           */
/* ------------------------------------------------------------------ */

const DIMENSIONS = ["week", "day", "client", "foreman"] as const;

const MEASURES = [
  "reports",
  "crewHours",
  "onSiteHours",
  "travelHours",
  "travelShare",
  "materialsCost",
  "yardCost",
  "boughtCost",
  "ownedHours",
  "rentalHours",
] as const;

const dimension = v.union(...DIMENSIONS.map((name) => v.literal(name)));
const measure = v.union(...MEASURES.map((name) => v.literal(name)));

/**
 * The same slice of time, grouped and sorted by whatever is being asked.
 *
 * Separate from `overview` rather than a parameter on it. The summary is one
 * fixed question asked well; this is any question asked adequately, and folding
 * them together would make the screen everybody opens pay for the flexibility
 * only some people use.
 *
 * Both read the same table through the same index and the same pure functions,
 * so a row here and a tile there can never disagree.
 */
export const breakdown = query({
  args: {
    from: v.string(),
    to: v.string(),
    by: dimension,
    /** Null keeps the dimension's own order: dates read as a sequence. */
    sort: v.optional(measure),
  },
  returns: v.object({
    truncated: v.boolean(),
    rows: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        reports: v.number(),
        crewHours: v.number(),
        onSiteHours: v.number(),
        travelHours: v.number(),
        travelShare: v.union(v.number(), v.null()),
        materialsCost: v.number(),
        yardCost: v.number(),
        boughtCost: v.number(),
        ownedHours: v.number(),
        rentalHours: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const scanned = await ctx.db
      .query("reports")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .take(MAX_SCAN + 1);

    const truncated = scanned.length > MAX_SCAN;
    const reports = scanned.slice(0, MAX_SCAN);

    // Only the foremen these reports actually name — one read each, not one per
    // report, since the same man files every report his crew sends.
    const ids = new Set(reports.flatMap((r) => (r.submittedBy ? [r.submittedBy] : [])));
    const users = await Promise.all([...ids].map((id) => ctx.db.get(id)));
    const names = new Map(users.flatMap((user) => (user ? [[user._id as string, user.name]] : [])));

    const rows = groupBy(
      reports.map((report) => ({ ...report, submittedBy: report.submittedBy as string })),
      args.by as Dimension,
      (userId) => names.get(userId) ?? userId
    );

    return {
      truncated,
      rows: sortRows(rows, (args.sort as Measure | undefined) ?? null, args.by as Dimension),
    };
  },
});

/**
 * Hours by person over the range.
 *
 * Reads `crewDays`, not `reports`. A person is on a crew, crew lives inside a
 * report as a nested array, and no index reaches into that — which is the whole
 * reason that table is fanned out on write.
 *
 * `by_date` rather than `by_person_date`, because this asks about everybody: the
 * range is what bounds it, exactly as it bounds the search.
 */
export const people = query({
  args: { from: v.string(), to: v.string() },
  returns: v.object({
    truncated: v.boolean(),
    rows: v.array(
      v.object({
        personId: v.union(v.string(), v.null()),
        name: v.string(),
        hours: v.number(),
        daysWorked: v.number(),
        daysMissingHours: v.number(),
        adhoc: v.boolean(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Four or five rows per report, so the cap is proportionally higher than the
    // one on reports and means the same thing.
    const cap = MAX_SCAN * 5;
    const scanned = await ctx.db
      .query("crewDays")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .take(cap + 1);

    return {
      truncated: scanned.length > cap,
      rows: payroll(scanned.slice(0, cap)),
    };
  },
});
