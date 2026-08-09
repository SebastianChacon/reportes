import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { crewDayFields, reportFields, userFields } from "./validators";

export default defineSchema({
  reports: defineTable(reportFields)
    .index("by_client_id", ["clientId"])
    .index("by_date", ["date"])
    .index("by_status_date", ["status", "date"]),

  /**
   * One row per person per report — the table that makes "pick a person, see
   * their day" a single indexed read. Crew lives inside the report as a nested
   * array and no index can reach into that, so it is fanned out on write.
   */
  crewDays: defineTable(crewDayFields)
    .index("by_person_date", ["personId", "date"])
    .index("by_date", ["date"])
    .index("by_report", ["reportId"]),

  /**
   * Photos go to file storage, not into the document: Convex caps a document at
   * 1 MB and a single job photo runs well past that.
   */
  photos: defineTable({
    reportId: v.id("reports"),
    storageId: v.id("_storage"),
    order: v.number(),
  }).index("by_report", ["reportId"]),

  users: defineTable(userFields)
    /**
     * The roster id is the account's real name here — a foreman has no email,
     * and asking for one at 6am in a truck is the whole thing this avoids.
     */
    .index("by_crew_member", ["crewMemberId"])
    .index("by_email", ["email"]),
});
