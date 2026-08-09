import { ConvexHttpClient } from "convex/browser";
import { convexUrl } from "./filing";

/**
 * The Convex client the server routes use.
 *
 * Separate from `lib/convexBackend.ts` on purpose. That one is lazily imported
 * by the phone and must stay out of the bundle when no deployment is configured;
 * this one runs on the server, where the cost of importing it is nothing and the
 * generated types are worth having.
 *
 * `null` when no deployment is configured, which every caller must handle: the
 * app is expected to run that way.
 */
export function convexServer(): ConvexHttpClient | null {
  const url = convexUrl();
  return url ? new ConvexHttpClient(url) : null;
}
