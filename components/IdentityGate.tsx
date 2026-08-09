"use client";

import React from "react";
import { CREW } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { loadEnrolled, submitPin, type PinRefusal, type PublicIdentity } from "@/lib/identity";
import type { Lang } from "@/lib/types";
import { Button, IconArrowLeft, IconSearch } from "./ui";

/**
 * Asked once, on the first launch: who is holding this phone.
 *
 * The screen exists for one field — `reports.submittedBy` — and that field is
 * what lets the office ask "who has not sent a report today". It cannot be
 * filled in after the fact, which is why this is asked before the first report
 * rather than bolted on later.
 *
 * It is skippable, deliberately. A foreman with no signal, or one holding a
 * borrowed phone at 6am, must never be locked out of filling in a report — the
 * report is the thing that matters. Skipping costs the office the attribution
 * for that day, not the day.
 */

const FOREMAN_ROLE = "F";

/** The people who actually file reports, offered before anyone has to type. */
const FOREMEN = CREW.filter((member) => member.roles.includes(FOREMAN_ROLE));

function matches(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export function IdentityGate({
  lang,
  online,
  onIdentified,
  onSkip,
}: {
  lang: Lang;
  online: boolean;
  onIdentified: (identity: PublicIdentity) => void;
  onSkip: () => void;
}) {
  const [personId, setPersonId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [enrolled, setEnrolled] = React.useState<string[] | null>(null);
  const [refusal, setRefusal] = React.useState<PinRefusal | null>(null);
  const [lockMinutes, setLockMinutes] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Asked once, up front: knowing who has already enrolled is what lets the
  // keypad say "enter your PIN" instead of "choose one" without the foreman
  // having to know which of the two he is.
  React.useEffect(() => {
    let live = true;
    void loadEnrolled().then((ids) => {
      if (live) setEnrolled(ids);
    });
    return () => {
      live = false;
    };
  }, []);

  const person = personId ? (CREW.find((m) => m.id === personId) ?? null) : null;
  // Unknown enrolment (offline when we asked) is treated as "sign in": if he has
  // no PIN yet the server says so, and the screen switches over.
  const isEnrolled = person !== null && enrolled !== null && enrolled.includes(person.id);
  const mode: "enrol" | "signIn" = enrolled === null || isEnrolled ? "signIn" : "enrol";

  const results = query.trim().length > 0 ? CREW.filter((m) => matches(m.name, query)) : [];

  const reset = () => {
    setPersonId(null);
    setPin("");
    setRefusal(null);
    setLockMinutes(null);
  };

  const press = (digit: string) => {
    setRefusal(null);
    setPin((current) => (current.length >= 4 ? current : current + digit));
  };

  const send = React.useCallback(async () => {
    if (!person || pin.length !== 4 || busy) return;
    setBusy(true);
    setRefusal(null);

    let result = await submitPin(person.id, pin, mode);

    // The two states we guessed wrong about are worth one silent retry rather
    // than an error the foreman has to interpret: he asked to be identified, and
    // which side of enrolment he is on is our bookkeeping, not his problem.
    if (!result.ok && (result.reason === "enrolled" || result.reason === "not_enrolled")) {
      result = await submitPin(person.id, pin, result.reason === "enrolled" ? "signIn" : "enrol");
    }

    setBusy(false);

    if (result.ok) {
      onIdentified(result.identity);
      return;
    }
    setRefusal(result.reason);
    setLockMinutes(result.retryInMinutes ?? null);
    setPin("");
  }, [person, pin, mode, busy, onIdentified]);

  // Four digits is the whole PIN, so there is nothing to confirm — submitting on
  // the fourth press removes the one button nobody needs to press.
  React.useEffect(() => {
    if (pin.length === 4 && !busy) void send();
  }, [pin, busy, send]);

  const errorText = (): string | null => {
    if (refusal === null) return null;
    switch (refusal) {
      case "wrong_pin":
        return t("pinWrong", lang);
      case "locked":
        return t("pinLocked", lang).replace("{n}", String(lockMinutes ?? 15));
      case "enrolled":
        return t("pinTaken", lang);
      case "unreachable":
      case "unconfigured":
        return t("pinNeedsSignal", lang);
      default:
        return t("pinWrong", lang);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--accent)]">
          {t("company", lang)}
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">
          {person ? person.name : t("whoAreYou", lang)}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          {person
            ? mode === "enrol"
              ? t("choosePinHint", lang)
              : t("enterPinHint", lang)
            : t("whoAreYouHint", lang)}
        </p>
      </header>

      {person === null ? (
        <div className="flex-1 space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold">{t("foremenShortcut", lang)}</h2>
            <ul className="space-y-2">
              {FOREMEN.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => setPersonId(member.id)}
                    className="touch-target card flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-semibold transition active:scale-[0.99]"
                  >
                    {member.name}
                    <span aria-hidden="true" className="text-[color:var(--ink-muted)]">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <label htmlFor="roster-search" className="mb-1.5 block text-sm font-medium">
              {t("findYourName", lang)}
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-muted)]"
              >
                <IconSearch />
              </span>
              <input
                id="roster-search"
                className="field"
                // Inline, like SearchPicker: `.field` sets its own padding through
                // @apply, and a utility class loses that specificity fight.
                style={{ paddingLeft: "2.5rem" }}
                type="search"
                inputMode="search"
                autoComplete="off"
                value={query}
                placeholder={t("findYourNamePlaceholder", lang)}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            {/* Nothing is listed until he types — 40 printed names is the paper
                form's problem, not this one's. */}
            {query.trim().length > 0 && (
              <ul className="mt-2 space-y-2">
                {results.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => setPersonId(member.id)}
                      className="touch-target card flex w-full items-center px-4 py-3 text-left text-[15px] font-semibold transition active:scale-[0.99]"
                    >
                      {member.name}
                    </button>
                  </li>
                ))}
                {results.length === 0 && (
                  <li className="rounded-xl border border-dashed border-[color:var(--line)] px-3 py-4 text-center text-sm text-[color:var(--ink-muted)]">
                    {t("noNameFound", lang)}
                  </li>
                )}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="flex-1">
          <h2 className="mb-3 text-sm font-semibold">
            {mode === "enrol" ? t("choosePin", lang) : t("enterPin", lang)}
          </h2>

          <div className="mb-4 flex items-center justify-center gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((slot) => (
              <span
                key={slot}
                className={`h-4 w-4 rounded-full border-[1.5px] transition ${
                  slot < pin.length
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]"
                    : "border-[color:var(--line)]"
                }`}
              />
            ))}
          </div>

          {/* The dots above are decorative; this is what a screen reader reads. */}
          <p className="sr-only" role="status">
            {pin.length}/4
          </p>

          {errorText() && (
            <p
              role="alert"
              className="mb-4 rounded-xl border-[1.5px] border-[color:var(--color-clay-600)] px-3 py-2.5 text-center text-sm font-medium text-[color:var(--color-clay-600)]"
            >
              {errorText()}
            </p>
          )}

          {!online && !errorText() && (
            <p className="mb-4 rounded-xl bg-[color:var(--accent-soft)] px-3 py-2.5 text-center text-sm font-medium text-[color:var(--accent)]">
              {t("pinNeedsSignal", lang)}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <PinKey key={digit} label={digit} onPress={() => press(digit)} disabled={busy} />
            ))}
            <button
              type="button"
              onClick={reset}
              className="touch-target rounded-xl px-4 py-4 text-sm font-semibold text-[color:var(--ink-muted)] transition active:scale-[0.98]"
            >
              {t("pinClear", lang)}
            </button>
            <PinKey label="0" onPress={() => press("0")} disabled={busy} />
            <button
              type="button"
              aria-label={t("pinDelete", lang)}
              onClick={() => setPin((current) => current.slice(0, -1))}
              className="touch-target flex items-center justify-center rounded-xl px-4 py-4 transition active:scale-[0.98]"
            >
              <IconArrowLeft />
            </button>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-6 w-full py-3 text-sm font-medium text-[color:var(--ink-muted)] underline decoration-[color:var(--line)] underline-offset-4"
          >
            {t("notYou", lang)}
          </button>
        </div>
      )}

      <footer className="mt-8 space-y-2">
        <Button full onClick={onSkip}>
          {t("identifyLater", lang)}
        </Button>
        <p className="text-center text-xs text-[color:var(--ink-muted)]">
          {t("identifyLaterHint", lang)}
        </p>
      </footer>
    </main>
  );
}

function PinKey({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="touch-target rounded-xl border-[1.5px] border-[color:var(--line)] bg-[color:var(--surface-raised)] px-4 py-4 text-xl font-semibold tabular-nums transition active:scale-[0.98] disabled:opacity-40"
    >
      {label}
    </button>
  );
}
