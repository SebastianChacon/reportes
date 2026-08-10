"use client";

import React from "react";
import Link from "next/link";
import { th, tc, type HomeKey } from "@/lib/i18n";
import { hours, money } from "@/lib/officeFormat";
import { loadLang, saveLang } from "@/lib/storage";
import type { Capability, CapabilityId, SystemStatus } from "@/lib/systemStatus";
import type { Lang } from "@/lib/types";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Inventory, Routes } from "./Inventory";
import { IconArrowRight, IconCheck, IconDash, IconDot } from "./icons";

export type Today = {
  reports: number;
  people: number;
  crewHours: number;
  materialsCost: number;
  notFiled: number;
} | null;

/**
 * Whether the reader may see the day's numbers, and why not when they may not.
 *
 * `unconfigured` and `out` are kept apart all the way to the screen because the
 * remedy differs: one is two environment variables, the other is a password.
 * Collapsing them would send a manager looking for a login on a server that has
 * no door to log into.
 */
type Access = "in" | "out" | "unconfigured";

const CAPS: Record<CapabilityId, { title: HomeKey; body: HomeKey; off?: HomeKey }> = {
  field: { title: "capFieldTitle", body: "capFieldBody" },
  email: { title: "capEmailTitle", body: "capEmailBody", off: "capEmailOff" },
  archive: { title: "capArchiveTitle", body: "capArchiveBody", off: "capArchiveOff" },
  console: { title: "capConsoleTitle", body: "capConsoleBody", off: "capConsoleOff" },
};

export function HomeShell({
  status,
  today,
  access,
}: {
  status: SystemStatus;
  today: Today;
  access: Access;
}) {
  // Starts Spanish and picks up the stored preference after mount, the same
  // bargain the wizard makes: the server cannot know the choice, and rendering
  // nothing until it does would blank the page for everyone to spare one
  // language a flash.
  const [lang, setLang] = React.useState<Lang>("es");

  React.useEffect(() => {
    const stored = loadLang();
    if (stored) setLang(stored);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    // The same key the wizard reads, so choosing English here means the phone
    // opens in English too. One product, one preference.
    saveLang(next);
  };

  const consoleReady = status.capabilities.find((c) => c.id === "console")?.state === "ready";

  return (
    // `lang` sits here rather than on <html>, which the root layout owns and
    // declares as Spanish. A subtree in another language is what this attribute
    // is for, and it is what tells a screen reader to change voice.
    <div lang={lang} className="step-enter mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
            {tc("company", lang)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {th("title", lang)}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--ink-muted)]">
            {th("tagline", lang)}
          </p>
        </div>
        <LanguageToggle lang={lang} onChange={changeLang} />
      </header>

      <div className="mt-8 flex flex-col gap-9">
        <Surfaces lang={lang} consoleReady={consoleReady} access={access} />
        <TodayPanel lang={lang} today={today} access={access} />
        <StatusPanel lang={lang} status={status} />
        <Inventory lang={lang} />
        <Routes lang={lang} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The two doors                                                       */
/* ------------------------------------------------------------------ */

function Surfaces({
  lang,
  consoleReady,
  access,
}: {
  lang: Lang;
  consoleReady: boolean;
  access: Access;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2" aria-label={th("surfaces", lang)}>
      <SurfaceCard
        lang={lang}
        title={th("fieldTitle", lang)}
        body={th("fieldBody", lang)}
        cta={th("fieldCta", lang)}
        href="/"
      />

      <SurfaceCard
        lang={lang}
        title={th("officeTitle", lang)}
        body={th("officeBody", lang)}
        // A console with nothing behind it is said, not linked. The card that
        // cannot be opened is still worth showing: it is half of what this
        // product is, and hiding it would make the page describe a smaller
        // product than the one that is installed.
        cta={
          !consoleReady
            ? null
            : access === "in"
              ? th("officeCta", lang)
              : th("officeSignInCta", lang)
        }
        href={access === "in" ? "/office" : "/office/entrar"}
        note={consoleReady ? undefined : th("officeLocked", lang)}
      />
    </section>
  );
}

function SurfaceCard({
  title,
  body,
  cta,
  href,
  note,
}: {
  lang: Lang;
  title: string;
  body: string;
  cta: string | null;
  href: string;
  note?: string;
}) {
  const inner = (
    <>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--ink-muted)]">{body}</p>
      {cta ? (
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink)]">
          {cta}
          <IconArrowRight />
        </span>
      ) : (
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--warn)]">
          <IconDash />
          {note}
        </span>
      )}
    </>
  );

  const shell = "card flex min-h-[11rem] flex-col p-5 sm:p-6";

  return cta ? (
    <Link href={href} className={`press ${shell}`}>
      {inner}
    </Link>
  ) : (
    <div className={shell}>{inner}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */

function TodayPanel({ lang, today, access }: { lang: Lang; today: Today; access: Access }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="today">
      <SectionHeading id="today">{th("today", lang)}</SectionHeading>

      {today ? (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={tc("reportsReceived", lang)} value={String(today.reports)} />
            <Stat label={tc("peopleOnSite", lang)} value={String(today.people)} />
            <Stat label={tc("labourHours", lang)} value={hours(today.crewHours) ?? "0"} />
            <Stat label={tc("materialsSpend", lang)} value={money(today.materialsCost)} />
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/office"
              className="press inline-flex touch-target items-center gap-1.5 text-sm font-semibold underline decoration-[color:var(--line)] underline-offset-4 hover:decoration-[color:var(--accent)]"
            >
              {th("todayOpen", lang)}
              <IconArrowRight />
            </Link>
            {today.notFiled > 0 && (
              <span className="chip font-semibold text-[color:var(--warn)]">
                <IconDash />
                {today.notFiled} {th("todayNotFiled", lang).toLowerCase()}
              </span>
            )}
          </div>
        </>
      ) : (
        // Never four zeroes. A day nobody worked and a server that cannot read
        // the archive produce the same numbers, and only one of them is a bug.
        <div className="card p-5">
          <p className="text-sm leading-relaxed text-[color:var(--ink-muted)]">
            {access === "unconfigured"
              ? th("todayUnconfigured", lang)
              : th("todaySignedOut", lang)}
          </p>
          {access === "out" && (
            <Link
              href="/office/entrar"
              className="press mt-3 inline-flex touch-target items-center gap-1.5 text-sm font-semibold underline decoration-[color:var(--line)] underline-offset-4 hover:decoration-[color:var(--accent)]"
            >
              {th("officeSignInCta", lang)}
              <IconArrowRight />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-[color:var(--ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* What is switched on                                                 */
/* ------------------------------------------------------------------ */

function StatusPanel({ lang, status }: { lang: Lang; status: SystemStatus }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="status">
      <SectionHeading id="status">{th("status", lang)}</SectionHeading>
      <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--ink-muted)]">
        {th("statusHint", lang)}
      </p>

      {status.fieldOnly && (
        <p className="card bg-[color:var(--warn-soft)] p-4 text-sm leading-relaxed text-[color:var(--warn)]">
          {th("fieldOnlyNote", lang)}
        </p>
      )}

      {/* `items-start`, so a capability with nothing to report does not grow a
          card's worth of empty space to match the one beside it listing three
          missing variables. */}
      <ul className="grid items-start gap-3 md:grid-cols-2">
        {status.capabilities.map((capability) => (
          <CapabilityCard key={capability.id} lang={lang} capability={capability} />
        ))}
      </ul>
    </section>
  );
}

function CapabilityCard({ lang, capability }: { lang: Lang; capability: Capability }) {
  const copy = CAPS[capability.id];
  const off = capability.state === "off";

  return (
    <li className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold tracking-tight">{th(copy.title, lang)}</h3>
        <StateBadge lang={lang} state={capability.state} />
      </div>

      <p className="text-sm leading-relaxed text-[color:var(--ink-muted)]">{th(copy.body, lang)}</p>

      {off && capability.missing.length > 0 && (
        <p className="text-sm">
          <span className="font-semibold">{th("missingLabel", lang)}:</span>{" "}
          {/* Printed rather than logged: whoever is reading this is the person
              who can set them, and the fix is two lines of deployment config.
              `translate="no"` because a browser that helpfully translates
              AUTH_SECRET hands someone a variable name that does not exist. */}
          <code translate="no" className="font-mono text-[13px] text-[color:var(--warn)]">
            {capability.missing.join(" · ")}
          </code>
        </p>
      )}

      {off && copy.off && (
        <p className="rounded-lg bg-[color:var(--accent-soft)] px-3 py-2 text-[13px] leading-relaxed text-[color:var(--ink-muted)]">
          <span className="font-semibold text-[color:var(--ink)]">{th("withoutIt", lang)}:</span>{" "}
          {th(copy.off, lang)}
        </p>
      )}
    </li>
  );
}

/**
 * The state, said in a word and drawn in a shape.
 *
 * Colour carries none of the meaning on its own — the label is the answer and
 * the icon differs per state, so the badge survives both a greyscale print and
 * a reader who cannot tell the green from the amber.
 */
function StateBadge({ lang, state }: { lang: Lang; state: Capability["state"] }) {
  const map = {
    always: { icon: <IconDot />, label: th("stateAlways", lang), tone: "var(--ok)" },
    ready: { icon: <IconCheck />, label: th("stateReady", lang), tone: "var(--ok)" },
    off: { icon: <IconDash />, label: th("stateOff", lang), tone: "var(--warn)" },
  }[state];

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        color: map.tone,
        background: `color-mix(in srgb, ${map.tone} 12%, transparent)`,
      }}
    >
      {map.icon}
      {map.label}
    </span>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]"
    >
      {children}
    </h2>
  );
}
