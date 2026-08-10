"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { tc, tcf } from "@/lib/i18n";

type Refusal = "bad_credentials" | "locked" | "not_office" | "unreachable" | "unconfigured";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
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
        router.replace("/office");
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
    <div className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <form onSubmit={submit} className="card w-full p-6">
        <h1 className="text-lg font-bold tracking-tight">{tc("signInTitle")}</h1>
        <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{tc("signInHint")}</p>

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
            className="mt-4 rounded-lg border border-[color:var(--warn)]/40 bg-[color:var(--warn-soft)] px-3 py-2 text-sm font-medium text-[color:var(--warn)]"
          >
            {messageFor(error)}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 min-h-11 w-full rounded-xl bg-[color:var(--accent)] px-4 text-[15px] font-semibold text-[color:var(--accent-contrast)] transition active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
        >
          {busy ? tc("signingIn") : tc("signIn")}
        </button>
      </form>
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
