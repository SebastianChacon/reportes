"use client";

import Link from "next/link";
import { th, tc, type HomeKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/**
 * What the software does, and where each screen is.
 *
 * The reference half of the overview: static, because it describes behaviour
 * that exists in the code rather than state that exists in an environment.
 * Anything that can be switched off is not here — it is in the status panel
 * above, reporting itself.
 */

const GROUPS: { title: HomeKey; items: HomeKey[] }[] = [
  {
    title: "groupPhone",
    items: [
      "itmSteps",
      "itmSearchAdd",
      "itmApplyAll",
      "itmAdhoc",
      "itmTimes",
      "itmAutosave",
      "itmQueue",
      "itmSignature",
      "itmPin",
    ],
  },
  {
    title: "groupTranslator",
    items: ["itmGlossary", "itmCache", "itmUnknown", "itmSwap"],
  },
  {
    title: "groupOutputs",
    items: ["itmPdf", "itmEmail", "itmShare", "itmBoth"],
  },
  {
    title: "groupOffice",
    items: ["itmDay", "itmReview", "itmSearch", "itmUrlFilters", "itmPerson", "itmIdempotent"],
  },
];

export function Inventory({ lang }: { lang: Lang }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="what-it-does">
      <Heading id="what-it-does">{th("whatItDoes", lang)}</Heading>

      <div className="grid items-start gap-3 md:grid-cols-2">
        {GROUPS.map((group) => (
          <div key={group.title} className="card flex flex-col gap-3 p-5">
            <h3 className="text-sm font-bold tracking-tight">{th(group.title, lang)}</h3>
            <ul className="flex flex-col gap-2.5">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                  {/* Decorative: the list already reads as a list to a screen
                      reader, so the marker must not be announced as content. */}
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--ink-muted)]"
                  />
                  <span className="text-[color:var(--ink-muted)]">{th(item, lang)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Every screen in the product.
 *
 * The two dynamic routes are printed with their parameter and say where they
 * are reached from, rather than being offered as links that would land on a
 * missing id — a dead link on the map of the product is worse than no map.
 */
const ROUTES: {
  path: string;
  what: HomeKey;
  href?: string;
  from?: HomeKey;
}[] = [
  { path: "/", what: "rtChooser", href: "/" },
  { path: "/reporte", what: "rtField", href: "/reporte" },
  { path: "/inicio", what: "rtStatus", href: "/inicio" },
  { path: "/office/entrar", what: "rtSignIn", href: "/office/entrar" },
  { path: "/office", what: "rtDay", href: "/office" },
  { path: "/office/reportes", what: "rtSearch", href: "/office/reportes" },
  { path: "/office/reportes/[id]", what: "rtReport", from: "fromReportCard" },
  { path: "/office/personas/[personId]", what: "rtPerson", from: "fromCrewName" },
];

export function Routes({ lang }: { lang: Lang }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="every-screen">
      <Heading id="every-screen">{th("routes", lang)}</Heading>
      <p className="max-w-2xl text-sm text-[color:var(--ink-muted)]">{th("routesHint", lang)}</p>

      <ul className="card divide-y divide-[color:var(--line)] overflow-hidden">
        {ROUTES.map((route) => {
          const body = (
            <>
              {/* A URL is not prose — a browser offering to translate it would
                  produce an address that goes nowhere. */}
              <code
                translate="no"
                className="font-mono text-[13px] font-semibold text-[color:var(--ink)]"
              >
                {route.path}
              </code>
              <span className="text-sm text-[color:var(--ink-muted)]">
                {th(route.what, lang)}
                {route.from && (
                  <span className="text-[color:var(--ink-muted)] opacity-70">
                    {" — "}
                    {th("reachedFrom", lang)} {th(route.from, lang)}
                  </span>
                )}
              </span>
            </>
          );

          // A grid rather than a flex row, so every path starts on the same
          // column and the list reads as one address book instead of six
          // sentences of different lengths. `max-content` rather than a fixed
          // width: the column is exactly as wide as the longest route, so
          // adding a longer one later cannot wrap it.
          const row =
            "touch-target gap-1 px-4 py-3 sm:grid sm:grid-cols-[max-content_1fr] sm:items-baseline sm:gap-4";

          return (
            <li key={route.path}>
              {route.href ? (
                <Link
                  href={route.href}
                  className={`press flex flex-col ${row} hover:bg-[color:var(--accent-soft)]`}
                >
                  {body}
                </Link>
              ) : (
                <div className={`flex flex-col ${row}`}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-[color:var(--ink-muted)]">
        {/* The console is English whichever language this page is in, and saying
            so here is cheaper than the surprise on arrival. */}
        {lang === "es"
          ? `La consola está en inglés — ${tc("office", "en")}, ${tc("navDay", "en")}, ${tc("navSearch", "en")}.`
          : "The field wizard is Spanish-first; the console is English."}
      </p>
    </section>
  );
}

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]"
    >
      {children}
    </h2>
  );
}
