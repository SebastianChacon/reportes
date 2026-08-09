import { jwtVerify, SignJWT } from "jose";

/**
 * Who the phone in front of you belongs to.
 *
 * A signed httpOnly cookie rather than a token the page can read: the only code
 * that ever learns the foreman's identity is the server, which is what makes
 * `reports.submittedBy` worth trusting. A value the browser could read is a
 * value the browser could invent.
 *
 * Nothing here is optional in the sense of "nice to have", but all of it is
 * optional in the sense that matters in the field: with no `AUTH_SECRET` set,
 * every function below reports "no session" and the app files reports exactly as
 * it does today — unattributed, but never blocked. That is the same bargain the
 * rest of the app makes with Resend and with Convex.
 */

export type Role = "foreman" | "manager" | "admin";

export type Identity = {
  /** The Convex `users` id. This is what lands in `reports.submittedBy`. */
  userId: string;
  name: string;
  role: Role;
  /** The roster id from lib/catalog.ts. */
  crewMemberId: string;
};

export const SESSION_COOKIE = "btn_session";

/**
 * Ninety days for a foreman: the phone becomes his and stays his through a
 * season. Twelve hours for the office, where the risk is a shared desktop and
 * the cost of signing in again is a keyboard away.
 */
export const FOREMAN_TTL_SECONDS = 90 * 24 * 60 * 60;
export const OFFICE_TTL_SECONDS = 12 * 60 * 60;

export function ttlFor(role: Role): number {
  return role === "foreman" ? FOREMAN_TTL_SECONDS : OFFICE_TTL_SECONDS;
}

/** `null` means no secret is configured, which is a supported way to run. */
export function sessionSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET?.trim();
  // A short secret on an HS256 token is the kind of thing that looks configured
  // and is not, so it is refused rather than accepted quietly.
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function isConfigured(): boolean {
  return sessionSecret() !== null;
}

export async function signSession(
  identity: Identity,
  ttlSeconds: number = ttlFor(identity.role)
): Promise<string | null> {
  const secret = sessionSecret();
  if (secret === null) return null;

  return await new SignJWT({
    name: identity.name,
    role: identity.role,
    crewMemberId: identity.crewMemberId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secret);
}

const ROLES: Role[] = ["foreman", "manager", "admin"];

/**
 * Verifies a session token.
 *
 * Returns `null` for every kind of failure — expired, tampered, signed with a
 * different secret, or malformed. The caller has the same job in all four cases,
 * and telling them apart would only ever help someone probing.
 */
export async function readSession(token: string | undefined): Promise<Identity | null> {
  const secret = sessionSecret();
  if (secret === null || !token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    const userId = payload.sub;
    const name = payload.name;
    const role = payload.role;
    const crewMemberId = payload.crewMemberId;

    if (typeof userId !== "string" || !userId) return null;
    if (typeof name !== "string" || !name) return null;
    if (typeof crewMemberId !== "string") return null;
    if (typeof role !== "string" || !ROLES.includes(role as Role)) return null;

    return { userId, name, role: role as Role, crewMemberId };
  } catch {
    return null;
  }
}

/** The `Set-Cookie` attributes. Kept in one place so sign-out matches sign-in. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    // The phone is on http://<lan-ip>:3000 during development, where a secure
    // cookie would simply never be stored.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
