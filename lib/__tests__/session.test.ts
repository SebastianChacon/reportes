// @vitest-environment node
//
// The suite runs in jsdom, but this module only ever runs on the server. jsdom's
// `TextEncoder` produces a `Uint8Array` from a different realm, which jose
// rightly refuses — so the test runs where the code runs.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FOREMAN_TTL_SECONDS,
  isConfigured,
  OFFICE_TTL_SECONDS,
  readSession,
  sessionCookieOptions,
  signSession,
  ttlFor,
  type Identity,
} from "../session";

const SECRET = "a".repeat(32);
const OTHER_SECRET = "b".repeat(32);

function foreman(over: Partial<Identity> = {}): Identity {
  return {
    userId: "jh77kkw4etdp2jyh0yjjm4r4sn8c4212",
    name: "Aguilar, Miguel",
    role: "foreman",
    crewMemberId: "aguilar-miguel",
    ...over,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session secret", () => {
  it("treats a missing secret as a supported way to run", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(isConfigured()).toBe(false);
    // Nothing throws — the app files reports unattributed instead of breaking.
    expect(await signSession(foreman())).toBeNull();
    expect(await readSession("anything")).toBeNull();
  });

  it("refuses a secret too short to be worth having", async () => {
    // The dangerous case is a placeholder that looks configured and is not.
    vi.stubEnv("AUTH_SECRET", "changeme");
    expect(isConfigured()).toBe(false);
    expect(await signSession(foreman())).toBeNull();
  });
});

describe("signing and reading a session", () => {
  it("round-trips an identity", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    const token = await signSession(foreman());
    expect(token).not.toBeNull();

    expect(await readSession(token!)).toEqual(foreman());
  });

  it("gives a foreman the season and the office the afternoon", () => {
    expect(ttlFor("foreman")).toBe(FOREMAN_TTL_SECONDS);
    expect(ttlFor("manager")).toBe(OFFICE_TTL_SECONDS);
    expect(ttlFor("admin")).toBe(OFFICE_TTL_SECONDS);
    expect(FOREMAN_TTL_SECONDS).toBe(90 * 24 * 60 * 60);
  });

  it("rejects a token signed with a different secret", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    const token = await signSession(foreman());

    vi.stubEnv("AUTH_SECRET", OTHER_SECRET);
    expect(await readSession(token!)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    const token = (await signSession(foreman()))!;

    // Re-encode the middle segment with someone else's user id. This is the
    // attack the signature exists to stop: filing a report as another foreman.
    const [header, payload, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<
      string,
      unknown
    >;
    decoded.sub = "someone-elses-user-id";
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    expect(await readSession(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it("rejects an expired token", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    const token = await signSession(foreman(), -60);
    expect(await readSession(token!)).toBeNull();
  });

  it("rejects a token with a role that is not a role", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    // Signed by us, so the signature checks out — the claim itself is the problem.
    const token = await signSession(foreman({ role: "superuser" as never }));
    expect(await readSession(token!)).toBeNull();
  });

  it("rejects nothing at all", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    expect(await readSession(undefined)).toBeNull();
    expect(await readSession("")).toBeNull();
    expect(await readSession("not.a.jwt")).toBeNull();
  });
});

describe("cookie attributes", () => {
  it("is unreadable by the page, which is the whole point", () => {
    const options = sessionCookieOptions(FOREMAN_TTL_SECONDS);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(FOREMAN_TTL_SECONDS);
  });

  it("expires immediately when handing the phone over", () => {
    expect(sessionCookieOptions(0).maxAge).toBe(0);
  });
});
