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

      {/* The two doors used to open this page. They are the whole of `/` now,
          and a screen that exists to answer "what is switched on" should not
          also be trying to route anybody. */}
      <div className="mt-8 flex flex-col gap-9">
        <TodayPanel lang={lang} today={today} access={access} />
        <StatusPanel lang={lang} status={status} />
        <Inventory lang={lang} />
        <Routes lang={lang} />
      </div>
    </div>
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
            {/* Solid ink rather than a tinted chip: on a page of quiet outlines,
                "somebody has not filed" is the one thing that should stop the
                eye, and inverting it is the loudest a single tint of ink can
                be. */}
            {today.notFiled > 0 && (
              <span className="chip border-transparent bg-[color:var(--accent)] font-semibold text-[color:var(--accent-contrast)]">
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
        <p className="notice p-4 text-sm leading-relaxed">{th("fieldOnlyNote", lang)}</p>
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
          <code
            translate="no"
            className="rounded bg-[color:var(--accent-soft)] px-1.5 py-0.5 font-mono text-[13px] font-semibold"
          >
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
 * Colour never carried the meaning here — the label was always the answer and
 * the icon always differed per state, which is why this badge survived a
 * greyscale print long before the screen became greyscale.
 *
 * What changed is the emphasis. Two of these three states are "nothing to do",
 * and one is "somebody has to go and set a variable". With no hue to separate
 * them, the difference is fill: the two settled states are quiet outlines, and
 * the one that needs a person is solid ink, which is the loudest a single tint
 * can be. It is the same rule the console's status chips follow — a reader
 * crossing between the two screens learns it once.
 */
function StateBadge({ lang, state }: { lang: Lang; state: Capability["state"] }) {
  const map = {
    always: { icon: <IconDot />, label: th("stateAlways", lang), needsSomebody: false },
    ready: { icon: <IconCheck />, label: th("stateReady", lang), needsSomebody: false },
    off: { icon: <IconDash />, label: th("stateOff", lang), needsSomebody: true },
  }[state];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        map.needsSomebody
          ? "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
          : "border-[color:var(--line)] text-[color:var(--ink-muted)]"
      }`}
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
