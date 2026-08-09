import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { crewDayFields, reportFields, reportStatus } from "./validators";
import {
  matchesFilter,
  missingForemen,
  rollUpPersonWeek,
  summariseDay,
} from "../lib/summaries";

/**
 * Everything the office reads.
 *
 * Every function here is a `query` — the console never writes through this file,
 * and the one mutation it needs (`reports.setStatus`) already lives with the
 * other writes so the audit fields are stamped in one place.
 *
 * Two rules hold throughout:
 *
 * 1. **Nothing is recomputed.** `totals` and `flags` were worked out at write
 *    time from `lib/calc.ts` and are read back as stored. A console that ran the
 *    arithmetic again could disagree with the PDF the foreman already sent, and
 *    then neither number would be worth anything.
 * 2. **Every read goes through an index.** The tables grow by one row per crew
 *    per day forever, so a `.collect()` over a whole table is a query that works
 *    until the season it doesn't.
 */

/**
 * How many documents a search may look at, and how many it may hand back.
 *
 * The scan cap is the one that matters: date filters bound a search, but "every
 * report this year" is a legal range and would otherwise be read in full to
 * answer a question about four of them. Both caps are reported back as
 * `truncated` rather than silently swallowed — a search that quietly drops
 * results is worse than one that says it stopped.
 */
const MAX_SCAN = 1_000;
const MAX_RESULTS = 200;

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const flags = v.array(v.object({ key: v.string(), field: v.union(v.string(), v.null()) }));

/** Who someone is, as the console shows them. Never a credential. */
const personRef = v.object({ userId: v.id("users"), name: v.string() });

const foremanRef = v.object({
  userId: v.id("users"),
  name: v.string(),
  crewMemberId: v.string(),
});

/**
 * One line in a list of reports — scannable without opening anything.
 *
 * `flags` rides along so a report with a 14-hour day looks different before
 * anyone clicks it, and `photoCount` is the denormalised copy, so counting
 * photos never touches the photos table.
 */
const reportCard = v.object({
  id: v.id("reports"),
  date: v.string(),
  clientName: v.string(),
  jobNumbers: v.array(v.string()),
  foreman: v.union(personRef, v.null()),
  dayHours: v.union(v.number(), v.null()),
  crewHours: v.number(),
  crewSize: v.number(),
  materialsCost: v.number(),
  status: reportStatus,
  flags,
  photoCount: v.number(),
  submittedAt: v.string(),
  /** Present only on a report the office sent back. */
  reviewNote: v.union(v.string(), v.null()),
});

const daySummary = v.object({
  reports: v.number(),
  people: v.number(),
  crewHours: v.number(),
  materialsCost: v.number(),
});

/** Built from the same field definitions the table uses, so it cannot drift. */
const reportDoc = v.object({
  _id: v.id("reports"),
  _creationTime: v.number(),
  ...reportFields,
});

const crewDayDoc = v.object({
  _id: v.id("crewDays"),
  _creationTime: v.number(),
  ...crewDayFields,
});

/* ------------------------------------------------------------------ */
/* Shared reads                                                        */
/* ------------------------------------------------------------------ */

/**
 * Looks up the foremen named by a batch of reports, once each.
 *
 * A day board of thirty reports filed by six foremen is six reads, not thirty:
 * the same man files every report his crew sends.
 */
async function foremenFor(
  ctx: QueryCtx,
  reports: Doc<"reports">[]
): Promise<Map<string, Doc<"users">>> {
  const ids = new Set<Id<"users">>();
  for (const report of reports) {
    if (report.submittedBy) ids.add(report.submittedBy);
  }

  const users = await Promise.all([...ids].map((id) => ctx.db.get(id)));

  const byId = new Map<string, Doc<"users">>();
  for (const user of users) {
    // A foreman whose account was cleared after a PIN reset leaves reports
    // pointing at a row that is gone. Those reports are still the record of the
    // work; they just show as unattributed.
    if (user !== null) byId.set(user._id, user);
  }
  return byId;
}

function toCard(report: Doc<"reports">, foremen: Map<string, Doc<"users">>) {
  const foreman = report.submittedBy ? foremen.get(report.submittedBy) : undefined;
  return {
    id: report._id,
    date: report.date,
    clientName: report.clientName,
    jobNumbers: report.jobNumbers,
    foreman: foreman ? { userId: foreman._id, name: foreman.name } : null,
    dayHours: report.totals.dayHours,
    crewHours: report.totals.crewHours,
    crewSize: report.crew.length,
    materialsCost: report.totals.materialsCost,
    status: report.status,
    flags: report.flags,
    photoCount: report.photoCount,
    submittedAt: report.submittedAt,
    reviewNote: report.reviewNote ?? null,
  };
}

/** Most recently filed first — the office watches the day fill up from the top. */
function newestFirst(a: Doc<"reports">, b: Doc<"reports">): number {
  return b.submittedAt.localeCompare(a.submittedAt);
}

/* ------------------------------------------------------------------ */
/* /office — the day                                                   */
/* ------------------------------------------------------------------ */

/**
 * One day: the four numbers across the top, and every report under them.
 *
 * `date` is passed in rather than read from the clock here. A Convex query runs
 * in UTC, and at 8pm in New Jersey that is already tomorrow — the office would
 * open the console after a long day and be told nobody filed anything.
 */
export const dayBoard = query({
  args: { date: v.string() },
  returns: v.object({
    date: v.string(),
    summary: daySummary,
    reports: v.array(reportCard),
  }),
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const foremen = await foremenFor(ctx, reports);

    return {
      date: args.date,
      summary: summariseDay(reports),
      reports: [...reports].sort(newestFirst).map((report) => toCard(report, foremen)),
    };
  },
});

/**
 * Who has not filed today.
 *
 * The screen the console exists for, and the one a mailbox cannot give you: a
 * mailbox shows what arrived, never what didn't.
 *
 * `unattributed` is not a footnote. A report filed before its foreman enrolled
 * carries no `submittedBy`, so it cannot clear anyone off this list — the office
 * needs to know the list may be naming a man whose report is sitting right
 * there.
 */
export const missingToday = query({
  args: { date: v.string() },
  returns: v.object({
    date: v.string(),
    missing: v.array(foremanRef),
    enrolled: v.number(),
    filed: v.number(),
    unattributed: v.number(),
  }),
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const filedBy = reports.flatMap((report) => (report.submittedBy ? [report.submittedBy] : []));

    // The full table, deliberately: `users` holds one row per person who has
    // ever enrolled — dozens, bounded by the size of the company, and there is
    // no index that answers "everyone" anyway.
    const users = await ctx.db.query("users").collect();
    const enrolled = users.flatMap((user) =>
      user.role === "foreman" && user.crewMemberId
        ? [{ userId: user._id, name: user.name, crewMemberId: user.crewMemberId }]
        : []
    );

    return {
      date: args.date,
      missing: missingForemen(enrolled, filedBy),
      enrolled: enrolled.length,
      filed: new Set(filedBy).size,
      unattributed: reports.length - filedBy.length,
    };
  },
});

/* ------------------------------------------------------------------ */
/* /office/reportes/[id] — one report                                  */
/* ------------------------------------------------------------------ */

/**
 * One report, whole: the document, its crew rows, and its photos.
 *
 * Returns null rather than throwing when the id is unknown. A pasted link is
 * how this page is meant to be reached, and a stale one should land on "that
 * report is gone", not on a crash.
 */
export const report = query({
  args: { id: v.id("reports") },
  returns: v.union(
    v.null(),
    v.object({
      report: reportDoc,
      foreman: v.union(personRef, v.null()),
      reviewer: v.union(personRef, v.null()),
      crewDays: v.array(crewDayDoc),
      photos: v.array(
        v.object({
          id: v.id("photos"),
          order: v.number(),
          /** Null when the blob is gone. The report still reads without it. */
          url: v.union(v.string(), v.null()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const found = await ctx.db.get(args.id);
    if (found === null) return null;

    const [crewDays, photoRows] = await Promise.all([
      ctx.db
        .query("crewDays")
        .withIndex("by_report", (q) => q.eq("reportId", args.id))
        .collect(),
      ctx.db
        .query("photos")
        .withIndex("by_report", (q) => q.eq("reportId", args.id))
        .collect(),
    ]);

    const [foreman, reviewer] = await Promise.all([
      found.submittedBy ? ctx.db.get(found.submittedBy) : Promise.resolve(null),
      found.reviewedBy ? ctx.db.get(found.reviewedBy) : Promise.resolve(null),
    ]);

    const photos = await Promise.all(
      [...photoRows]
        // Back into the order the foreman took them, which is the order they
        // tell the story of the day in.
        .sort((a, b) => a.order - b.order)
        .map(async (photo) => ({
          id: photo._id,
          order: photo.order,
          url: await ctx.storage.getUrl(photo.storageId),
        }))
    );

    return {
      report: found,
      foreman: foreman ? { userId: foreman._id, name: foreman.name } : null,
      reviewer: reviewer ? { userId: reviewer._id, name: reviewer.name } : null,
      crewDays,
      photos,
    };
  },
});

/* ------------------------------------------------------------------ */
/* /office/reportes — search                                           */
/* ------------------------------------------------------------------ */

/**
 * Reports in a date range, narrowed.
 *
 * The range is required and does the real work — it is what keeps this bounded.
 * `status` and `personId` each pick a different index; the rest are checked on
 * the rows those indexes already narrowed to, because no index can answer
 * "client name contains".
 *
 * Free text over the description is deliberately not here. That needs a Convex
 * search index, which is its own decision, and it can be added later without
 * moving any of this.
 */
export const search = query({
  args: {
    from: v.string(),
    to: v.string(),
    status: v.optional(reportStatus),
    clientName: v.optional(v.string()),
    jobNumber: v.optional(v.string()),
    submittedBy: v.optional(v.id("users")),
    /** A roster id: every report this person was on the crew of. */
    personId: v.optional(v.string()),
  },
  returns: v.object({
    reports: v.array(reportCard),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const filter = {
      clientName: args.clientName,
      jobNumber: args.jobNumber,
      submittedBy: args.submittedBy,
    };

    let scanned: Doc<"reports">[];
    let hitScanCap = false;

    // Pulled out of `args` so the narrowing survives into the index closures.
    const { personId, status } = args;

    if (personId) {
      // Asking about a person starts from his rows, not from every report in
      // the range — that is exactly what `crewDays` was fanned out for.
      const rows = await ctx.db
        .query("crewDays")
        .withIndex("by_person_date", (q) =>
          q.eq("personId", personId).gte("date", args.from).lte("date", args.to)
        )
        .order("desc")
        .take(MAX_SCAN + 1);

      hitScanCap = rows.length > MAX_SCAN;

      const reportIds = new Set(rows.slice(0, MAX_SCAN).map((row) => row.reportId));
      const found = await Promise.all([...reportIds].map((id) => ctx.db.get(id)));
      scanned = found.filter((row): row is Doc<"reports"> => row !== null);

      // One man on two crews in a day gives two rows pointing at two reports;
      // the status filter still has to be applied, and no index did it above.
      if (status) scanned = scanned.filter((row) => row.status === status);
    } else {
      const rows = status
        ? await ctx.db
            .query("reports")
            .withIndex("by_status_date", (q) =>
              q.eq("status", status).gte("date", args.from).lte("date", args.to)
            )
            .order("desc")
            .take(MAX_SCAN + 1)
        : await ctx.db
            .query("reports")
            .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
            .order("desc")
            .take(MAX_SCAN + 1);

      hitScanCap = rows.length > MAX_SCAN;
      scanned = rows.slice(0, MAX_SCAN);
    }

    const matched = scanned.filter((row) => matchesFilter(row, filter)).sort(newestFirst);
    const page = matched.slice(0, MAX_RESULTS);
    const foremen = await foremenFor(ctx, page);

    return {
      reports: page.map((row) => toCard(row, foremen)),
      truncated: hitScanCap || matched.length > MAX_RESULTS,
    };
  },
});

/* ------------------------------------------------------------------ */
/* /office/personas/[personId] — one person's week                     */
/* ------------------------------------------------------------------ */

/**
 * What one person worked, day by day, over a range.
 *
 * `PLAN.md` guesses this one screen may justify the project by itself, and it
 * costs almost nothing: `by_person_date` was built for exactly this read, so a
 * week is one indexed range over rows that were written already fanned out.
 *
 * Only roster people can be asked about. A name a foreman typed in is stored
 * with a null `personId` on purpose — it is a name on one report, not a person
 * with a history, and treating it as one would invent a new man every time the
 * same name was typed.
 */
export const personWeek = query({
  args: { personId: v.string(), from: v.string(), to: v.string() },
  returns: v.object({
    personId: v.string(),
    /** As last written on a crew row. Absent when the range holds no work. */
    name: v.union(v.string(), v.null()),
    days: v.array(
      v.object({
        date: v.string(),
        hours: v.union(v.number(), v.null()),
        entries: v.array(crewDayDoc),
      })
    ),
    totalHours: v.number(),
    daysWorked: v.number(),
    daysMissingHours: v.number(),
  }),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("crewDays")
      .withIndex("by_person_date", (q) =>
        q.eq("personId", args.personId).gte("date", args.from).lte("date", args.to)
      )
      .collect();

    const week = rollUpPersonWeek(rows);
    const last = week.days.at(-1)?.entries.at(-1) ?? null;

    return {
      personId: args.personId,
      name: last ? last.name : null,
      ...week,
    };
  },
});
