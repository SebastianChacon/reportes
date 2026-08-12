"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { tc, tcf } from "@/lib/i18n";
import { SIGN_IN_PREFILL } from "@/lib/demoAccount";

type Refusal = "bad_credentials" | "locked" | "not_office" | "unreachable" | "unconfigured";

/** Where the console starts when nothing else was asked for. */
const HOME = "/office";

/**
 * Where to land after a successful sign-in.
 *
 * The console's gate sends an anonymous reader here with the page they wanted
 * in `?next=`, so that pasting a link to one report does not deposit them on
 * today's board with no idea what happened to the link.
 *
 * Anything that is not a path inside the console is discarded. Without that
 * test this parameter is an open redirect: `?next=https://evil.example` would
 * turn the company's own sign-in page into a way of bouncing a signed-in
 * manager somewhere else. `startsWith("/office")` alone is not enough —
 * `//evil.example` is protocol-relative and `/officexyz` is not the console —
 * so both are excluded explicitly.
 */
export function safeNext(raw: string | null): string {
  if (raw === null) return HOME;
  if (!raw.startsWith("/") || raw.startsWith("//")) return HOME;
  if (raw !== HOME && !raw.startsWith(`${HOME}/`)) return HOME;
  return raw;
}

/*
 * Both fields start full — see `SIGN_IN_PREFILL` in lib/demoAccount.ts for what
 * that pair is and when to take it out again.
 *
 * It can only ever be the demonstration account. The real office password could
 * not be offered even in principle: to appear in the field it has to reach the
 * browser, and anything the browser is given is public.
 */
export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));

  const [email, setEmail] = React.useState(SIGN_IN_PREFILL.email);
  const [password, setPassword] = React.useState(SIGN_IN_PREFILL.password);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<{ reason: Refusal; minutes?: number } | null>(null);

  const emailId = React.useId();
  const passwordId = React.useId();
  const errorId = React.useId();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: Refusal;
        retryInMinutes?: number;
      };

      if (body.ok) {
        // `refresh` first so the gated layout re-runs with the new cookie
        // instead of replaying the anonymous render from the client cache.
        router.refresh();
        router.replace(next);
        return;
      }

      setError({ reason: body.reason ?? "bad_credentials", minutes: body.retryInMinutes });
    } catch {
      setError({ reason: "unreachable" });
    } finally {
      setBusy(false);
    }
  }

  return (
    // A column, not a row: the way back sits under the form rather than beside it.
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <form onSubmit={submit} className="card w-full p-6">
        <h1 className="text-lg font-bold tracking-tight">{tc("signInTitle")}</h1>
        <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{tc("signInHint")}</p>

        {/* Said out loud, because the alternative is somebody signing in with
            these, seeing 292 invented reports, and approving one believing it
            is a crew's real day. */}
        <p className="notice mt-4 text-sm">{tc("signInDemo")}</p>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium">
              {tc("email")}
            </label>
            <input
              id={emailId}
              className="field"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium">
              {tc("password")}
            </label>
            <input
              id={passwordId}
              className="field"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="notice mt-4 text-sm"
          >
            {messageFor(error)}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 min-h-11 w-full rounded-xl bg-[color:var(--accent)] px-4 text-[15px] font-semibold text-[color:var(--accent-contrast)] transition enabled:hover:bg-[color:var(--accent-hover)] active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
        >
          {busy ? tc("signingIn") : tc("signIn")}
        </button>
      </form>

      {/* The way out for someone who arrived here and is not the person with
          the password — a foreman following a link, most often. It goes to the
          chooser, which is the screen that can send him to the wizard instead;
          the status page it used to point at could not. */}
      <p className="mt-5 text-center text-sm">
        <Link
          href="/"
          className="text-[color:var(--ink-muted)] underline decoration-[color:var(--line)] underline-offset-4 hover:text-[color:var(--ink)]"
        >
          {tc("backToOverview")}
        </Link>
      </p>
    </div>
  );
}

function messageFor(error: { reason: Refusal; minutes?: number }): string {
  switch (error.reason) {
    case "locked":
      return tcf("signInLocked", { n: error.minutes ?? 15 });
    case "unreachable":
      return tc("signInUnreachable");
    case "unconfigured":
      return tc("signInUnconfigured");
    // `not_office` deliberately reads as a bad password: a foreman who typed
    // his address into the office door learns nothing about who has an account.
    default:
      return tc("signInBad");
  }
}
