import { MIN_SECRET_LENGTH } from "./session";

/**
 * What this server can actually do right now.
 *
 * The app is built to run with almost nothing configured — the field wizard
 * works on a phone with no backend at all, and every piece above it switches
 * itself off rather than failing loudly. That is a good property and a terrible
 * one to debug: three environments running the same commit behave differently
 * and nothing on screen says why.
 *
 * So this reads the same variables the real code paths read, by the same rules,
 * and the overview screen prints the answer. It never guesses and it never
 * reaches the network: a variable being present is exactly the claim being
 * made, no more. Whether Resend's key is *valid* is a question only Resend can
 * answer, and asking it on every page load would make an overview screen depend
 * on a third party being up.
 */

/** Injected in tests. Nothing here mutates it. */
export type Env = Record<string, string | undefined>;

export type CapabilityId = "field" | "email" | "archive" | "console";

export type Capability = {
  id: CapabilityId;
  /**
   * `always` is not a third kind of "on". It marks the one capability that has
   * no variable to miss, which is the point being made: a foreman is never
   * blocked by this screen's contents.
   */
  state: "always" | "ready" | "off";
  /** Named, not counted — whoever reads this is the person who can set them. */
  missing: string[];
};

export type SystemStatus = {
  capabilities: Capability[];
  /** True when nothing above the phone is wired up. Drives the empty state. */
  fieldOnly: boolean;
};

function present(env: Env, name: string): boolean {
  return (env[name] ?? "").trim().length > 0;
}

/** The same rule `sessionSecret()` applies, so the two can never disagree. */
function secretUsable(env: Env): boolean {
  return (env.AUTH_SECRET ?? "").trim().length >= MIN_SECRET_LENGTH;
}

function absent(env: Env, names: string[]): string[] {
  return names.filter((name) => !present(env, name));
}

export function systemStatus(env: Env = process.env): SystemStatus {
  // Mirrors app/api/send-report/route.ts, which refuses to send without all three.
  const emailMissing = absent(env, [
    "RESEND_API_KEY",
    "REPORT_TO_EMAIL",
    "REPORT_FROM_EMAIL",
  ]);

  // Mirrors lib/filing.ts:convexUrl().
  const archiveMissing = absent(env, ["NEXT_PUBLIC_CONVEX_URL"]);

  // Mirrors lib/officeSession.ts:missingConfig() — both variables, not just the
  // one read first. A console with a secret and no deployment lets a manager in
  // and then shows him an empty day, which is the failure it exists to prevent.
  const consoleMissing = [
    ...(secretUsable(env) ? [] : ["AUTH_SECRET"]),
    ...archiveMissing,
  ];

  const capabilities: Capability[] = [
    { id: "field", state: "always", missing: [] },
    { id: "email", state: emailMissing.length === 0 ? "ready" : "off", missing: emailMissing },
    { id: "archive", state: archiveMissing.length === 0 ? "ready" : "off", missing: archiveMissing },
    { id: "console", state: consoleMissing.length === 0 ? "ready" : "off", missing: consoleMissing },
  ];

  return {
    capabilities,
    fieldOnly: capabilities.every((c) => c.state !== "ready"),
  };
}
