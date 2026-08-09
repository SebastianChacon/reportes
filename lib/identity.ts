import type { Role } from "./session";

/**
 * The phone's side of "who is holding this device".
 *
 * Every function returns `null` rather than throwing when the server cannot be
 * reached. Not knowing who the foreman is has to be an ordinary state: he is in
 * a truck in a dead spot and the report still has to get filled in.
 */

/** What the phone is allowed to know. The `users` id stays on the server. */
export type PublicIdentity = { name: string; role: Role; crewMemberId: string };

export type SessionState = {
  /** False when no `AUTH_SECRET` is set — there is nothing to sign in to. */
  configured: boolean;
  identity: PublicIdentity | null;
};

export type PinRefusal =
  | "unknown_person"
  | "bad_pin_shape"
  | "enrolled"
  | "not_enrolled"
  | "wrong_pin"
  | "locked"
  | "unreachable"
  | "unconfigured";

export type PinResult =
  | { ok: true; identity: PublicIdentity }
  | { ok: false; reason: PinRefusal; retryInMinutes?: number };

/** `null` means the question could not be asked, not that nobody is signed in. */
export async function loadSession(): Promise<SessionState | null> {
  try {
    const response = await fetch("/api/auth/session", { credentials: "same-origin" });
    if (!response.ok) return null;
    return (await response.json()) as SessionState;
  } catch {
    return null;
  }
}

/** Roster ids that already have a PIN, so the phone knows which question to ask. */
export async function loadEnrolled(): Promise<string[] | null> {
  try {
    const response = await fetch("/api/auth/foreman", { credentials: "same-origin" });
    if (!response.ok) return null;
    const body = (await response.json()) as { ok?: boolean; enrolled?: string[] };
    return body.ok && Array.isArray(body.enrolled) ? body.enrolled : null;
  } catch {
    return null;
  }
}

export async function submitPin(
  crewMemberId: string,
  pin: string,
  mode: "enrol" | "signIn"
): Promise<PinResult> {
  try {
    const response = await fetch("/api/auth/foreman", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ crewMemberId, pin, mode }),
    });
    const body = (await response.json()) as PinResult;
    // A body that does not parse into either shape is a proxy or a captive
    // portal answering for us, which is the same as unreachable.
    if (typeof body?.ok !== "boolean") return { ok: false, reason: "unreachable" };
    return body;
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
  } catch {
    // Nothing to do: the cookie outlives a failed request, and the next attempt
    // to hand the phone over will clear it.
  }
}
