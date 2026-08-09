import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { userRole } from "./validators";
import { CREW } from "../lib/catalog";

/**
 * Who filed a report.
 *
 * The whole point of this file is one field: `reports.submittedBy`. Without it
 * the office cannot answer "who did not send a report today", which is the
 * question the console exists to answer — and a report archived without a
 * foreman can never have one added later.
 *
 * The PIN is verified here rather than in the app so that the hash never leaves
 * the deployment: the functions that can read it are `internal`, and the ones
 * the app can call return an identity or a refusal, never a credential.
 */

const ITERATIONS = 100_000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** Four digits. Anything else is a bug in the caller, not a wrong PIN. */
const PIN_SHAPE = /^\d{4}$/;

/* ------------------------------------------------------------------ */
/* Hashing                                                             */
/* ------------------------------------------------------------------ */

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function hashPin(pin: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromHex(saltHex) as unknown as BufferSource,
      iterations: ITERATIONS,
    },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

/** Compares in constant time, so a wrong PIN cannot be narrowed down by timing. */
function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* The roster is the source of truth for names                          */
/* ------------------------------------------------------------------ */

/**
 * Read from `lib/catalog.ts` rather than taken from the caller. The phone could
 * otherwise enrol "Aguilar, Miguel" under any spelling it liked, and the console
 * would show two people who are one.
 */
function rosterMember(crewMemberId: string) {
  return CREW.find((member) => member.id === crewMemberId) ?? null;
}

/* ------------------------------------------------------------------ */
/* Internal — the only functions that touch a hash                     */
/* ------------------------------------------------------------------ */

/**
 * Spelled out in TypeScript as well as in validators because the actions below
 * call functions in this same file. Without an explicit annotation, TypeScript
 * has to infer an action's return type from a `ctx.runQuery` whose own type it is
 * still working out, and gives up with an implicit `any`.
 */
type Credentials = {
  userId: Id<"users">;
  name: string;
  role: "foreman" | "manager" | "admin";
  pinHash: string;
  pinSalt: string;
  failedAttempts: number;
  lockedUntil?: string;
};

type Outcome =
  | {
      ok: true;
      identity: {
        userId: Id<"users">;
        name: string;
        role: "foreman" | "manager" | "admin";
        crewMemberId: string;
      };
    }
  | {
      ok: false;
      reason:
        | "unknown_person"
        | "bad_pin_shape"
        | "enrolled"
        | "not_enrolled"
        | "wrong_pin"
        | "locked";
      retryInMinutes?: number;
    };

const credentials = v.union(
  v.null(),
  v.object({
    userId: v.id("users"),
    name: v.string(),
    role: userRole,
    pinHash: v.string(),
    pinSalt: v.string(),
    failedAttempts: v.number(),
    lockedUntil: v.optional(v.string()),
  })
);

export const credentialsFor = internalQuery({
  args: { crewMemberId: v.string() },
  returns: credentials,
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_crew_member", (q) => q.eq("crewMemberId", args.crewMemberId))
      .unique();
    if (user === null) return null;
    return {
      userId: user._id,
      name: user.name,
      role: user.role,
      pinHash: user.pinHash,
      pinSalt: user.pinSalt,
      failedAttempts: user.failedAttempts,
      lockedUntil: user.lockedUntil,
    };
  },
});

export const createForeman = internalMutation({
  args: {
    crewMemberId: v.string(),
    name: v.string(),
    roles: v.array(v.string()),
    pinHash: v.string(),
    pinSalt: v.string(),
  },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    // Two phones enrolling the same name at once would otherwise both insert,
    // and `by_crew_member` would stop being unique for every read after that.
    const existing = await ctx.db
      .query("users")
      .withIndex("by_crew_member", (q) => q.eq("crewMemberId", args.crewMemberId))
      .unique();
    if (existing !== null) return null;

    return await ctx.db.insert("users", {
      name: args.name,
      role: "foreman",
      crewMemberId: args.crewMemberId,
      roles: args.roles,
      pinHash: args.pinHash,
      pinSalt: args.pinSalt,
      failedAttempts: 0,
      enrolledAt: new Date().toISOString(),
    });
  },
});

export const recordAttempt = internalMutation({
  args: { userId: v.id("users"), ok: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null) return null;

    if (args.ok) {
      await ctx.db.patch(args.userId, {
        failedAttempts: 0,
        lockedUntil: undefined,
        lastSeenAt: new Date().toISOString(),
      });
      return null;
    }

    const failedAttempts = user.failedAttempts + 1;
    await ctx.db.patch(args.userId, {
      failedAttempts,
      lockedUntil:
        failedAttempts >= MAX_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
          : undefined,
    });
    return null;
  },
});

/**
 * Un-enrols an account, so the name can claim a new PIN.
 *
 * Internal, which today means reachable only from the Convex dashboard or an
 * authenticated CLI — the app cannot call it. That is the right level for now:
 * a foreman who forgets his PIN needs someone in the office to clear it, and
 * "anyone can reset anyone" would undo the point of having a PIN at all.
 *
 * Reports already filed keep pointing at the deleted row. They are the record of
 * who did the work; re-enrolling creates a new account, not a new past.
 */
export const removeAccount = internalMutation({
  args: { crewMemberId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_crew_member", (q) => q.eq("crewMemberId", args.crewMemberId))
      .unique();
    if (user === null) return false;
    await ctx.db.delete(user._id);
    return true;
  },
});

/* ------------------------------------------------------------------ */
/* Public — identity in, identity out, never a hash                    */
/* ------------------------------------------------------------------ */

/** Everything the session cookie needs, and nothing the phone should not see. */
const identity = v.object({
  userId: v.id("users"),
  name: v.string(),
  role: userRole,
  crewMemberId: v.string(),
});

const outcome = v.union(
  v.object({ ok: v.literal(true), identity }),
  v.object({
    ok: v.literal(false),
    /**
     * `enrolled` is not an error the foreman caused — it means this name already
     * has a PIN, so the phone should ask him to enter it instead of setting one.
     */
    reason: v.union(
      v.literal("unknown_person"),
      v.literal("bad_pin_shape"),
      v.literal("enrolled"),
      v.literal("not_enrolled"),
      v.literal("wrong_pin"),
      v.literal("locked")
    ),
    /** Minutes left on a lockout, so the phone can say when to come back. */
    retryInMinutes: v.optional(v.number()),
  })
);

function lockedFor(lockedUntil: string | undefined): number | null {
  if (!lockedUntil) return null;
  const left = new Date(lockedUntil).getTime() - Date.now();
  return left > 0 ? Math.ceil(left / 60_000) : null;
}

/**
 * Claims a roster name and sets its PIN. Once.
 *
 * First claim wins, and it is deliberate: the alternative is the office issuing
 * PINs by phone before anyone can file a report, which would have this whole
 * feature waiting on a phone call. What it protects is the field that matters —
 * once Miguel's phone is Miguel's, no other phone can file as him.
 */
export const enrol = action({
  args: { crewMemberId: v.string(), pin: v.string() },
  returns: outcome,
  handler: async (ctx, args): Promise<Outcome> => {
    const member = rosterMember(args.crewMemberId);
    if (member === null) return { ok: false, reason: "unknown_person" };
    if (!PIN_SHAPE.test(args.pin)) return { ok: false, reason: "bad_pin_shape" };

    const existing: Credentials | null = await ctx.runQuery(internal.auth.credentialsFor, {
      crewMemberId: args.crewMemberId,
    });
    if (existing !== null) return { ok: false, reason: "enrolled" };

    const pinSalt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const pinHash = await hashPin(args.pin, pinSalt);

    const userId: Id<"users"> | null = await ctx.runMutation(internal.auth.createForeman, {
      crewMemberId: args.crewMemberId,
      name: member.name,
      roles: member.roles,
      pinHash,
      pinSalt,
    });
    // Lost the race against another phone claiming the same name.
    if (userId === null) return { ok: false, reason: "enrolled" };

    return {
      ok: true,
      identity: {
        userId,
        name: member.name,
        role: "foreman",
        crewMemberId: args.crewMemberId,
      },
    };
  },
});

/** Proves this phone belongs to a roster name. */
export const signIn = action({
  args: { crewMemberId: v.string(), pin: v.string() },
  returns: outcome,
  handler: async (ctx, args): Promise<Outcome> => {
    if (!PIN_SHAPE.test(args.pin)) return { ok: false, reason: "bad_pin_shape" };

    const found: Credentials | null = await ctx.runQuery(internal.auth.credentialsFor, {
      crewMemberId: args.crewMemberId,
    });
    if (found === null) return { ok: false, reason: "not_enrolled" };

    const minutes = lockedFor(found.lockedUntil);
    if (minutes !== null) {
      return { ok: false, reason: "locked", retryInMinutes: minutes };
    }

    const hash = await hashPin(args.pin, found.pinSalt);
    const ok = sameHash(hash, found.pinHash);
    await ctx.runMutation(internal.auth.recordAttempt, { userId: found.userId, ok });

    if (!ok) return { ok: false, reason: "wrong_pin" };

    return {
      ok: true,
      identity: {
        userId: found.userId,
        name: found.name,
        role: found.role,
        crewMemberId: args.crewMemberId,
      },
    };
  },
});

/**
 * Which roster names already have a PIN.
 *
 * The phone asks before showing the keypad, so a foreman who has enrolled is
 * asked for his PIN and one who has not is asked to choose one — without either
 * of them having to understand the difference.
 */
export const enrolled = action({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx): Promise<string[]> => await ctx.runQuery(internal.auth.enrolledIds, {}),
});

export const enrolledIds = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.flatMap((u) => (u.crewMemberId ? [u.crewMemberId] : []));
  },
});
