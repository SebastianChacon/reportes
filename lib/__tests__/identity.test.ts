import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEnrolled, loadSession, signOut, submitPin } from "../identity";

/**
 * Every assertion here is about one rule: not knowing who the foreman is has to
 * be an ordinary state. A truck in a dead spot must never produce an exception
 * that reaches the wizard.
 */

function respondWith(body: unknown, ok = true, status = 200) {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

function fails() {
  return vi.fn(async () => {
    throw new TypeError("Failed to fetch");
  }) as unknown as typeof fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadSession", () => {
  it("reports who the phone belongs to", async () => {
    const identity = { name: "Aguilar, Miguel", role: "foreman", crewMemberId: "aguilar-miguel" };
    vi.stubGlobal("fetch", respondWith({ configured: true, identity }));

    expect(await loadSession()).toEqual({ configured: true, identity });
  });

  it("distinguishes 'nothing to sign in to' from 'nobody signed in'", async () => {
    vi.stubGlobal("fetch", respondWith({ configured: false, identity: null }));
    const state = await loadSession();
    expect(state).toEqual({ configured: false, identity: null });
  });

  it("answers null when the question could not be asked", async () => {
    vi.stubGlobal("fetch", fails());
    expect(await loadSession()).toBeNull();
  });

  it("answers null on a server error rather than inventing a session", async () => {
    vi.stubGlobal("fetch", respondWith({}, false, 500));
    expect(await loadSession()).toBeNull();
  });

  it("sends the cookie, which is the only reason the request exists", async () => {
    const fetchMock = respondWith({ configured: true, identity: null });
    vi.stubGlobal("fetch", fetchMock);
    await loadSession();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/session",
      expect.objectContaining({ credentials: "same-origin" })
    );
  });
});

describe("loadEnrolled", () => {
  it("lists the roster ids that already have a PIN", async () => {
    vi.stubGlobal("fetch", respondWith({ ok: true, enrolled: ["aguilar-miguel"] }));
    expect(await loadEnrolled()).toEqual(["aguilar-miguel"]);
  });

  it("answers null when the deployment is not configured", async () => {
    // The phone then asks for a PIN rather than offering to set one, which is the
    // safe way round: the server refuses an enrolment that would overwrite.
    vi.stubGlobal("fetch", respondWith({ ok: false, reason: "unconfigured" }, false, 503));
    expect(await loadEnrolled()).toBeNull();
  });

  it("answers null offline", async () => {
    vi.stubGlobal("fetch", fails());
    expect(await loadEnrolled()).toBeNull();
  });
});

describe("submitPin", () => {
  it("returns the identity on a correct PIN", async () => {
    const identity = { name: "Aguilar, Miguel", role: "foreman", crewMemberId: "aguilar-miguel" };
    vi.stubGlobal("fetch", respondWith({ ok: true, identity }));

    expect(await submitPin("aguilar-miguel", "1234", "signIn")).toEqual({ ok: true, identity });
  });

  it("passes a refusal through with its reason intact", async () => {
    // The phone needs the reason to say something useful: a locked account and a
    // wrong PIN call for different words.
    vi.stubGlobal("fetch", respondWith({ ok: false, reason: "locked", retryInMinutes: 15 }, false, 401));

    expect(await submitPin("aguilar-miguel", "0000", "signIn")).toEqual({
      ok: false,
      reason: "locked",
      retryInMinutes: 15,
    });
  });

  it("treats a reply that is not an answer as unreachable", async () => {
    // A captive portal on a job-site wifi answers 200 with its own HTML.
    vi.stubGlobal("fetch", respondWith({ hello: "portal" }));
    expect(await submitPin("aguilar-miguel", "1234", "signIn")).toEqual({
      ok: false,
      reason: "unreachable",
    });
  });

  it("reports unreachable rather than throwing at the caller", async () => {
    vi.stubGlobal("fetch", fails());
    expect(await submitPin("aguilar-miguel", "1234", "enrol")).toEqual({
      ok: false,
      reason: "unreachable",
    });
  });

  it("asks for the mode it was told to, and carries the cookie", async () => {
    const fetchMock = respondWith({ ok: true, identity: {} });
    vi.stubGlobal("fetch", fetchMock);
    await submitPin("aguilar-miguel", "1234", "enrol");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/foreman",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ crewMemberId: "aguilar-miguel", pin: "1234", mode: "enrol" }),
      })
    );
  });
});

describe("signOut", () => {
  it("does not throw when the phone is offline", async () => {
    vi.stubGlobal("fetch", fails());
    await expect(signOut()).resolves.toBeUndefined();
  });
});
