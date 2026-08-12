"use client";

import React from "react";
import Link from "next/link";
import { th, tc } from "@/lib/i18n";
import { loadLang, saveLang } from "@/lib/storage";
import type { Lang } from "@/lib/types";
import { LanguageToggle } from "@/components/LanguageToggle";
import { IconArrowRight } from "@/components/home/icons";
import { IconLock } from "./icons";

/**
 * The chooser at `/`.
 *
 * One question — are you here to file a report, or to administer? — and nothing
 * else on the screen. No numbers, no capability list, no route inventory: those
 * moved to `/inicio`, which is now the status page it always mostly was. This
 * screen is two doors and the company's name, because it is the one screen both
 * audiences land on and neither of them came here to read.
 *
 * The two doors are deliberately unequal, and that is the whole design:
 *
 * 1. **The field door is solid ink.** Not out of importance — out of frequency.
 *    It is opened every morning by every crew; the other is opened once a day by
 *    one person. In a product with one tint and no colour to spend, a filled
 *    rectangle is the loudest thing available, and it belongs to the path that
 *    gets walked twenty times as often.
 * 2. **The administration door wears a padlock and says "Sign in", not
 *    "Open".** The doors are asymmetric — one is open, the other wants a
 *    password — and the screen has to say so *before* the click. Without it, the
 *    only way to learn the difference is to tap and land in a login nobody
 *    asked for.
 * 3. **A door that cannot open is shown, but not as a link.** On a server with
 *    no `AUTH_SECRET` or no Convex URL there is nothing behind it, and offering
 *    a link that lands on a configuration notice is worse than saying so here.
 *    It still appears: it is half of what this product is, and hiding it would
 *    describe a smaller product than the one installed.
 */

/** What the reader may do with the administration door, decided on the server. */
export type AdminDoor = "open" | "locked" | "unavailable";

export function Portada({ admin }: { admin: AdminDoor }) {
  // Starts Spanish and picks up the stored preference after mount — the same
  // bargain the wizard and the overview make. The server cannot know the
  // choice, and rendering nothing until it does would blank the page for
  // everyone to spare one language a flash.
  const [lang, setLang] = React.useState<Lang>("es");

  React.useEffect(() => {
    const stored = loadLang();
    if (stored) setLang(stored);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    // The same key the wizard reads, so choosing English here means the phone
    // opens in English too. One product, one preference — and it is the reason
    // the toggle earns its place on a screen that is otherwise two buttons.
    saveLang(next);
  };

  return (
    // `lang` sits here rather than on <html>, which the root layout owns and
    // declares as Spanish. A subtree in another language is what the attribute
    // is for, and it is what tells a screen reader to change voice.
    <div lang={lang} className="step-enter flex min-h-dvh flex-col px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
          {tc("company", lang)}
        </p>
        <LanguageToggle lang={lang} onChange={changeLang} />
      </header>

      {/* The doors take the middle of the screen rather than sitting under the
          header, because on a desktop a two-button page pinned to the top reads
          as a page that failed to finish loading. `flex-1` + centring is what
          makes the emptiness look chosen. */}
      <main className="flex flex-1 items-center justify-center py-10">
        <section
          aria-label={th("doorsLabel", lang)}
          className="grid w-full max-w-3xl gap-4 md:grid-cols-2"
        >
          {/* Report first in the DOM, which is also first under the thumb on a
              phone and first in the tab order. The person who opens this screen
              most is the one who needs the fewest decisions. */}
          <Door
            href="/reporte"
            title={th("doorFieldTitle", lang)}
            body={th("doorFieldBody", lang)}
            cta={th("doorFieldCta", lang)}
            filled
          />

          <AdminCard lang={lang} admin={admin} />
        </section>
      </main>
    </div>
  );
}

function AdminCard({ lang, admin }: { lang: Lang; admin: AdminDoor }) {
  const title = th("doorAdminTitle", lang);
  const body = th("doorAdminBody", lang);

  // Nothing behind it on this server. Said, not linked.
  if (admin === "unavailable") {
    return (
      <div className="card flex min-h-[9rem] flex-col justify-between p-6 opacity-70 sm:min-h-[11rem]">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--ink-muted)]">{body}</p>
        </div>
        <p className="mt-4 text-sm font-semibold text-[color:var(--ink-muted)]">
          {th("doorAdminLocked", lang)}
        </p>
      </div>
    );
  }

  // A live session skips the form entirely. Showing a password prompt to
  // someone who is already signed in is the product forgetting who it let in
  // ninety seconds ago.
  const signedIn = admin === "open";

  return (
    <Door
      href={signedIn ? "/office" : "/office/entrar"}
      title={title}
      body={body}
      cta={signedIn ? th("doorAdminOpen", lang) : th("doorAdminSignIn", lang)}
      // The padlock goes only on the door that actually wants a password.
      lock={signedIn ? undefined : th("doorLockedHint", lang)}
    />
  );
}

function Door({
  href,
  title,
  body,
  cta,
  filled = false,
  lock,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  filled?: boolean;
  lock?: string;
}) {
  return (
    <Link
      href={href}
      /*
       * The filled door deliberately does **not** take `.card`.
       *
       * `.card` sets `background` in an unlayered rule, and Tailwind's
       * utilities live in the `utilities` layer, which loses to unlayered CSS.
       * So `bg-[color:var(--accent)]` was silently ignored while
       * `text-[color:var(--accent-contrast)]` applied — which in dark mode is
       * near-black ink on a near-black card, i.e. an invisible button. It
       * restates the same 16px radius and 1px border instead of overriding
       * them with `!important`, which would have hidden the same trap from the
       * next person.
       */
      className={`press flex min-h-[9rem] flex-col justify-between rounded-2xl border p-6 sm:min-h-[11rem] ${
        filled
          ? "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-hover)]"
          : "card"
      }`}
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <p
          className={`mt-1.5 text-sm leading-relaxed ${
            // The filled card cannot use `--ink-muted`: it is a grey chosen
            // against a white surface, and on near-black ink it disappears.
            // Its own contrast colour at reduced opacity is the only version
            // that stays legible without introducing a second token.
            filled ? "opacity-75" : "text-[color:var(--ink-muted)]"
          }`}
        >
          {body}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold">
          {cta}
          <IconArrowRight />
        </span>
        {lock && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--ink-muted)]">
            <IconLock />
            {lock}
          </span>
        )}
      </div>
    </Link>
  );
}
