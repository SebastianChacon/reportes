import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { submittedCrewDayFields, submittedReportFields } from "./validators";

/**
 * Files one finished report.
 *
 * Idempotent on `clientId`. The phone retries from its outbox whenever signal
 * comes back — several times, in practice, since mobile browsers fire `online`
 * repeatedly as a connection settles. A second call for a report already filed
 * must be a no-op that reports success, or the office gets the same day twice
 * and payroll counts it twice.
 */
export const submit = mutation({
  args: {
    report: v.object(submittedReportFields),
    crewDays: v.array(v.object(submittedCrewDayFields)),
    /** Uploaded before this call, in the order the foreman took them. */
    photoStorageIds: v.array(v.id("_storage")),
    /**
     * Who filed it. Set only by the server route that files reports, which is
     * the only thing that can read the session cookie — the phone never sends
     * this, because a phone able to name the foreman could name anyone.
     *
     * Optional because a report filed before its foreman enrolled, or replayed
     * from a history written by an older build, must still land. An unattributed
     * report is worth more to the office than a lost one.
     */
    submittedBy: v.optional(v.id("users")),
  },
  returns: v.object({ reportId: v.id("reports"), duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.report.clientId))
      .unique();

    if (existing !== null) {
      // The report is already filed. The photos that came with this retry were
      // uploaded before we could know that, so drop them rather than leave
      // orphaned blobs nobody will ever read or pay attention to.
      await Promise.all(args.photoStorageIds.map((id) => ctx.storage.delete(id)));

      // A report that landed before its foreman enrolled has no `submittedBy`,
      // and it is the one field that cannot be reconstructed later. If a retry
      // finally knows who filed it, take the answer.
      if (existing.submittedBy === undefined && args.submittedBy !== undefined) {
        await ctx.db.patch(existing._id, { submittedBy: args.submittedBy });
      }

      return { reportId: existing._id, duplicate: true };
    }

    const reportId = await ctx.db.insert("reports", {
      ...args.report,
      submittedBy: args.submittedBy,
    });

    // Fanned out in the same mutation as the report, so the two can never
    // disagree about who worked that day.
    for (const row of args.crewDays) {
      await ctx.db.insert("crewDays", { ...row, reportId });
    }

    await Promise.all(
      args.photoStorageIds.map((storageId, order) =>
        ctx.db.insert("photos", { reportId, storageId, order })
      )
    );

    return { reportId, duplicate: false };
  },
});

/**
 * Approve a report, or send it back to the foreman with a note.
 *
 * Lives here rather than in the console so the audit fields are written in one
 * place; the console calls it once auth is wired in Phase 1.
 *
 * `note` is not merged — it is replaced by whatever this call passes, so
 * approving without one clears it. A correction that has already been made
 * should not keep showing on the report as if it were still outstanding.
 */
export const setStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("approved"), v.literal("needs_review"), v.literal("submitted")),
    reviewedBy: v.optional(v.id("users")),
    /** Why it is going back. Only meaningful alongside `needs_review`. */
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (report === null) throw new Error("That report no longer exists.");

    const note = args.note?.trim();

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: args.reviewedBy,
      reviewNote: note ? note : undefined,
    });
    return null;
  },
});

/**
 * Removes a report and everything fanned out from it.
 *
 * Only reachable from the Convex dashboard for now. It exists because a test
 * submission filed during setup would otherwise sit in the office's day board
 * forever, and deleting the report alone would strand its crew rows.
 */
export const remove = mutation({
  args: { reportId: v.id("reports") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const crewDays = await ctx.db
      .query("crewDays")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    for (const row of crewDays) await ctx.db.delete(row._id);

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    for (const photo of photos) {
      await ctx.storage.delete(photo.storageId as Id<"_storage">);
      await ctx.db.delete(photo._id);
    }

    await ctx.db.delete(args.reportId);
    return null;
  },
});
