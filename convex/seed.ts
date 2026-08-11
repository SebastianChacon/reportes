import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { buildSubmission } from "../lib/submission";
import { DEMO_CREWS, DEMO_PREFIX, demoReports, isDemoId } from "../lib/demoData";
import { shiftDate, startOfWeek, todayForOffice } from "../lib/officeDate";

/**
 * Six weeks of reports that never happened, and the one command that removes
 * them again.
 *
 * The console has four screens that only mean something over time — the summary,
 * the search, a person's week, the heat map — and none of them can be shown to
 * anybody on the three test reports a new deployment has. This fills that in.
 *
 * Two properties make it safe to run against a deployment that already has real
 * data in it:
 *
 * - **Every report it writes has a `clientId` starting `demo:`**, so `clear`
 *   deletes exactly what `demo` created and cannot touch a report a foreman
 *   filed. It also makes the whole thing idempotent for free: re-running is a
 *   no-op, because `by_client_id` already has the row.
 * - **Every account it creates carries `demo: true`.** Deleting accounts by name
 *   would eventually delete a real person's; deleting them by a flag written at
 *   creation cannot.
 *
 * Nothing here is public. `npx convex run` is authenticated as the deployment
 * owner and can call internal functions, which is the right level for a command
 * that writes two hundred rows.
 */

/** Everyone starts with the same PIN. It is demo data; it is meant to be typed. */
const DEMO_PIN = "2468";

/**
 * A console login to show the thing with.
 *
 * Deliberately on `.test` — a reserved TLD that can never resolve — so nobody
 * can be emailed at it by accident, and so this address could never be mistaken
 * for a real person's account. `clear` deletes it with the rest.
 */
const DEMO_OFFICE = {
  email: "demo@backtonature.test",
  name: "Demo (office)",
  password: "demo-back-to-nature",
} as const;

/** Reports older than this at the end of the run are treated as already reviewed. */
const APPROVE_AFTER_DAYS = 14;

/**
 * Spelled out in TypeScript as well as in validators, for the same reason
 * `convex/auth.ts` does it: the actions below call functions in this same file
 * through `_generated/api`, whose type is built *from* this file. Without an
 * explicit annotation TypeScript gives up on the cycle and infers `any` — and
 * because `api` is one object, that `any` spreads to every `convex.query(...)`
 * in the app, which is how a seed script silently un-types four screens.
 */
type SeedResult = {
  from: string;
  to: string;
  enrolled: string[];
  office: { email: string; password: string } | null;
  filed: number;
  skipped: number;
  approved: number;
};

type ClearResult = { removed: number; accounts: number; prefix: string };

/** How many reports one `clear` batch removes. Kept well inside a transaction. */
const CLEAR_BATCH = 40;

/**
 * Twelve weeks ending today — twice the window the summary opens on.
 *
 * Six would fill every chart, and every delta on the screen would still read
 * "no earlier period to compare against", because the six weeks before the
 * opening view would be empty. A demo where the most interesting column is
 * permanently blank is a demo of a broken feature.
 *
 * Anchored to the clock rather than hard-coded, so it is always "the last three
 * months" whenever it is run, and snapped to a Monday so the weekly columns are
 * whole weeks rather than a ragged first bar.
 */
function demoRange(): { from: string; to: string } {
  const to = todayForOffice();
  return { from: startOfWeek(shiftDate(to, -77)), to };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/**
 * Files every demo report whose date falls inside one week.
 *
 * The generator is run over the **whole** range on every call and then filtered,
 * not run per week: it walks one PRNG in a fixed order, so asking it for a
 * single week would give that week different reports than the full run does. It
 * is a few hundred plain objects — cheaper than the writes that follow.
 */
export const seedWeek = internalMutation({
  args: { from: v.string(), to: v.string(), weekFrom: v.string(), weekTo: v.string() },
  returns: v.object({ filed: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    const all = demoReports({ from: args.from, to: args.to });
    const week = all.filter(
      (entry) => entry.report.date >= args.weekFrom && entry.report.date <= args.weekTo
    );

    // The same foreman files every report his crew sends, so his account is
    // looked up once for the week rather than once per report.
    const accounts = new Map<string, Id<"users"> | null>();
    async function accountFor(crewMemberId: string): Promise<Id<"users"> | undefined> {
      if (!accounts.has(crewMemberId)) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_crew_member", (q) => q.eq("crewMemberId", crewMemberId))
          .unique();
        accounts.set(crewMemberId, user?._id ?? null);
      }
      return accounts.get(crewMemberId) ?? undefined;
    }

    let filed = 0;
    let skipped = 0;

    for (const entry of week) {
      // Built by the same function the phone calls, so `totals`, `flags` and the
      // opening status come out of production code rather than out of here.
      const submission = buildSubmission(entry.report);

      const existing = await ctx.db
        .query("reports")
        .withIndex("by_client_id", (q) => q.eq("clientId", submission.clientId))
        .unique();

      if (existing !== null) {
        skipped++;
        continue;
      }

      const reportId = await ctx.db.insert("reports", {
        ...submission.report,
        submittedBy: await accountFor(entry.foremanId),
      });

      for (const row of submission.crewDays) {
        await ctx.db.insert("crewDays", { ...row, reportId });
      }

      filed++;
    }

    return { filed, skipped };
  },
});

/**
 * Ages the older half of the demo into "already reviewed".
 *
 * A month where every report is still `New` reads as a month nobody looked at,
 * and leaves the status filter with one value in it. Reports carrying a flag are
 * deliberately left alone: those are the ones the office would still be chasing,
 * and the review queue is meant to have something in it.
 */
export const approveOlder = internalMutation({
  args: { before: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const reviewer = (await ctx.db.query("users").collect()).find(
      (user) => user.role === "admin" || user.role === "manager"
    );

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status_date", (q) => q.eq("status", "submitted").lt("date", args.before))
      .collect();

    let approved = 0;
    for (const report of reports) {
      if (!isDemoId(report.clientId)) continue;
      await ctx.db.patch(report._id, {
        status: "approved",
        reviewedAt: new Date(`${report.date}T21:40:00-04:00`).toISOString(),
        reviewedBy: reviewer?._id,
      });
      approved++;
    }
    return approved;
  },
});

/**
 * Stamps a freshly created account as the seed's, so `clear` can find it.
 *
 * By roster id for a foreman and by address for the office account — the two
 * kinds of account are identified by different things, and neither of them by a
 * document id, because the thing that created them hands one back only when it
 * wins the race to create it.
 */
export const markDemoAccount = internalMutation({
  args: { crewMemberId: v.optional(v.string()), email: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = args.crewMemberId
      ? await ctx.db
          .query("users")
          .withIndex("by_crew_member", (q) => q.eq("crewMemberId", args.crewMemberId))
          .unique()
      : args.email
        ? await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique()
        : null;

    if (user !== null) await ctx.db.patch(user._id, { demo: true });
    return null;
  },
});

/** Which of the demo foremen already have an account — real or seeded. */
export const missingAccounts = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const missing: string[] = [];
    for (const crew of DEMO_CREWS) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_crew_member", (q) => q.eq("crewMemberId", crew.foremanId))
        .unique();
      if (user === null) missing.push(crew.foremanId);
    }
    return missing;
  },
});

/* ------------------------------------------------------------------ */
/* Removal                                                             */
/* ------------------------------------------------------------------ */

/**
 * Deletes one batch of demo reports and everything fanned out from them.
 *
 * Batched because a `clear` that tried to remove two hundred reports and eight
 * hundred crew rows in one transaction is a command that works right up until
 * the demo is big enough to matter.
 */
export const clearBatch = internalMutation({
  args: { from: v.string(), to: v.string() },
  returns: v.object({ removed: v.number(), done: v.boolean() }),
  handler: async (ctx, args) => {
    const scanned: Doc<"reports">[] = await ctx.db
      .query("reports")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .take(600);

    const demo = scanned.filter((report) => isDemoId(report.clientId));
    const batch = demo.slice(0, CLEAR_BATCH);

    for (const report of batch) {
      const crewDays = await ctx.db
        .query("crewDays")
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .collect();
      for (const row of crewDays) await ctx.db.delete(row._id);

      const photos = await ctx.db
        .query("photos")
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .collect();
      for (const photo of photos) {
        await ctx.storage.delete(photo.storageId);
        await ctx.db.delete(photo._id);
      }

      await ctx.db.delete(report._id);
    }

    return { removed: batch.length, done: demo.length <= batch.length };
  },
});

/** Removes only accounts the seed created — never one a real foreman enrolled. */
export const clearAccounts = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const seeded = users.filter((user) => user.demo === true);
    for (const user of seeded) await ctx.db.delete(user._id);
    return seeded.length;
  },
});

/* ------------------------------------------------------------------ */
/* The two commands                                                    */
/* ------------------------------------------------------------------ */

/**
 * `npx convex run seed:demo`
 *
 * Enrols the foremen who have no account, then files the range one week at a
 * time. Both halves are safe to repeat: enrolment refuses a name that is already
 * claimed, and a report whose `clientId` is already in the table is skipped.
 */
export const demo = action({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  returns: v.object({
    from: v.string(),
    to: v.string(),
    enrolled: v.array(v.string()),
    /** The console login, when this run is the one that created it. */
    office: v.union(v.object({ email: v.string(), password: v.string() }), v.null()),
    filed: v.number(),
    skipped: v.number(),
    approved: v.number(),
  }),
  handler: async (ctx, args): Promise<SeedResult> => {
    const range = demoRange();
    const from = args.from ?? range.from;
    const to = args.to ?? range.to;

    // Reuses the phone's own enrolment path rather than hashing a PIN here.
    // There is exactly one place in this codebase that turns a secret into a
    // stored hash, and a seed script is not a good reason for a second one.
    const missing: string[] = await ctx.runQuery(internal.seed.missingAccounts, {});
    const enrolled: string[] = [];
    for (const crewMemberId of missing) {
      const outcome = await ctx.runAction(api.auth.enrol, { crewMemberId, pin: DEMO_PIN });
      if (outcome.ok) {
        await ctx.runMutation(internal.seed.markDemoAccount, { crewMemberId });
        enrolled.push(crewMemberId);
      }
    }

    // Somebody has to be able to open the console to look at any of this.
    // `createOfficeAccount` returns null when the address is already taken, so
    // re-running the seed never quietly resets a password.
    const officeId = await ctx.runAction(internal.auth.createOfficeAccount, {
      email: DEMO_OFFICE.email,
      name: DEMO_OFFICE.name,
      password: DEMO_OFFICE.password,
      role: "admin",
    });
    if (officeId !== null) {
      await ctx.runMutation(internal.seed.markDemoAccount, { email: DEMO_OFFICE.email });
    }

    let filed = 0;
    let skipped = 0;
    for (let weekFrom = from; weekFrom <= to; weekFrom = shiftDate(weekFrom, 7)) {
      const weekTo = shiftDate(weekFrom, 6);
      const week: { filed: number; skipped: number } = await ctx.runMutation(
        internal.seed.seedWeek,
        { from, to, weekFrom, weekTo: weekTo < to ? weekTo : to }
      );
      filed += week.filed;
      skipped += week.skipped;
    }

    const approved: number = await ctx.runMutation(internal.seed.approveOlder, {
      before: shiftDate(to, -APPROVE_AFTER_DAYS),
    });

    return {
      from,
      to,
      enrolled,
      office:
        officeId === null
          ? null
          : { email: DEMO_OFFICE.email, password: DEMO_OFFICE.password },
      filed,
      skipped,
      approved,
    };
  },
});

/**
 * `npx convex run seed:clear`
 *
 * Takes the demo back out. Scans a range wide enough to cover any range `demo`
 * could have written, and deletes only rows whose `clientId` carries the prefix —
 * so a report a foreman actually filed on one of those days is left alone.
 */
export const clear = action({
  args: {},
  returns: v.object({ removed: v.number(), accounts: v.number(), prefix: v.string() }),
  handler: async (ctx): Promise<ClearResult> => {
    // Two years either side of today: wider than any range `demo` accepts, and
    // still an indexed scan rather than a walk of the whole table.
    const today = todayForOffice();
    const from = shiftDate(today, -730);
    const to = shiftDate(today, 730);

    let removed = 0;
    for (;;) {
      const batch: { removed: number; done: boolean } = await ctx.runMutation(
        internal.seed.clearBatch,
        { from, to }
      );
      removed += batch.removed;
      if (batch.done || batch.removed === 0) break;
    }

    const accounts: number = await ctx.runMutation(internal.seed.clearAccounts, {});
    return { removed, accounts, prefix: DEMO_PREFIX };
  },
});
