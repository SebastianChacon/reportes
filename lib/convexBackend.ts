import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { convexUrl, makeConvexBackend, type FilingBackend } from "./filing";

/**
 * Wires the phone's half of filing to a real Convex deployment — when there is one.
 *
 * Only the photo upload lives here now. The report itself goes through
 * `/api/reports`, because it has to be stamped with a `submittedBy` that the
 * phone is not allowed to choose. Photos have no such problem and every reason
 * to take the short path: they are megabytes on a truck's data plan.
 *
 * Deliberately the only module in the app that imports Convex on the client, and
 * it is imported lazily, so a build with no deployment configured neither ships
 * the client nor changes a code path the foreman walks through.
 *
 * A plain HTTP client rather than the websocket one: the phone files a report
 * once a day and then closes the tab. There is nothing here to keep a live
 * subscription open for, and a socket that reconnects in the background is one
 * more thing draining a battery in a truck.
 */

const uploadUrlRef = makeFunctionReference<"mutation">("photos:generateUploadUrl");

/** `undefined` means "not worked out yet"; `null` means "no deployment configured". */
let cached: FilingBackend | null | undefined;

export function filingBackend(): FilingBackend | null {
  if (cached !== undefined) return cached;

  const url = convexUrl();
  cached = url ? makeConvexBackend(new ConvexHttpClient(url), { uploadUrl: uploadUrlRef }) : null;

  return cached;
}
