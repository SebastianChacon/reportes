import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * A one-shot URL the phone POSTs a single JPEG to.
 *
 * Photos never travel inside the report document: Convex caps a document at
 * 1 MB and one downscaled job photo already runs past that. The phone uploads
 * each file first, collects the storage ids, and hands those to `reports.submit`.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});
