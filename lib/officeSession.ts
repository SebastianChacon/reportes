import { cookies } from "next/headers";
import { readSession, isConfigured, SESSION_COOKIE, type Identity } from "./session";
import { convexUrl } from "./filing";

/**
 * The console's door, read on the server for every office page.
 *
 * The console shows every report the company has ever filed and can approve
 * them, so unlike the phone it is not allowed to degrade into "we do not know
 * who you are, carry on". The phone makes that bargain because a report at 6am
 * matters more than knowing whose it is; here the whole screen *is* the thing
 * being protected, and an unattributed reader is not a lesser reader — it is
 * anybody with the URL.
 *
 * Three answers, deliberately distinguished:
 *
 * - `unconfigured` — no `AUTH_SECRET`. Nobody can sign in because there is
 *   nothing to sign in to, so offering a login form would be a lie. The console
 *   says so instead of showing an empty day, which is the failure mode
 *   PLAN-CONSOLA.md §8 calls "a screen that lies".
 * - `anonymous` — configured, but no valid session. Send them to sign in.
 * - `signed in` — with a role the office is allowed to have.
 */

export type OfficeAccess =
  | { state: "unconfigured"; missing: string[] }
  | { state: "anonymous" }
  | { state: "ok"; identity: Identity };

/** A foreman's session is a real session — it is just not a key to this door. */
export function isOfficeRole(role: Identity["role"]): boolean {
  return role === "manager" || role === "admin";
}

/**
 * The two variables the console cannot run without, named so the answer to
 * "why is it blank" is on the screen rather than in someone's memory.
 *
 * Both are checked, not just the one that happens to be read first: a server
 * with a secret and no deployment would let a PM sign in and then show him an
 * empty day, which is the failure this whole screen exists to prevent.
 */
export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!isConfigured()) missing.push("AUTH_SECRET");
  if (!convexUrl()) missing.push("NEXT_PUBLIC_CONVEX_URL");
  return missing;
}

export async function officeAccess(): Promise<OfficeAccess> {
  const missing = missingConfig();
  if (missing.length > 0) return { state: "unconfigured", missing };

  const jar = await cookies();
  const identity = await readSession(jar.get(SESSION_COOKIE)?.value);

  if (identity === null || !isOfficeRole(identity.role)) return { state: "anonymous" };
  return { state: "ok", identity };
}
