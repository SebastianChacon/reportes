"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tc } from "@/lib/i18n";

/**
 * The four places the console goes, in the order the questions get asked:
 * what happened today, what is coming, where did the month go, and where is
 * that one report.
 *
 * The board sits second because it is the only one of the four that is *edited*
 * rather than read — it is where the afternoon's work goes, so it is not made
 * the furthest tab from the day board people start on.
 *
 * A client component only so the current page can say it is the current page —
 * `aria-current` rather than colour alone, so the answer to "where am I" does
 * not depend on telling two greys apart.
 */
const LINKS = [
  { href: "/office", label: "navDay" },
  { href: "/office/calendar", label: "navCalendar" },
  { href: "/office/resumen", label: "navSummary" },
  { href: "/office/reportes", label: "navSearch" },
] as const;

/**
 * Which tab owns a URL.
 *
 * `/office` has to match exactly — it is the prefix of every other route here,
 * so a prefix test would light "The day" on all of them.
 *
 * The rest claim their subtree. Before, the test was exact everywhere, which
 * meant `/office/resumen/avanzado` lit no tab at all: the reader was two levels
 * inside the summary and the navigation had nothing to say about where they
 * were.
 *
 * A single report is still nobody's: it is reached from the day and from the
 * search alike, so neither gets to claim it. That was a deliberate choice and it
 * stays one — the breadcrumb above the report is what orients that page.
 */
export function owns(pathname: string, href: string): boolean {
  if (href === "/office") return pathname === href;
  if (href === "/office/reportes") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConsoleNav() {
  const pathname = usePathname();

  return (
    /*
      Scrollable rather than wrapping. The header note in the console layout
      counts the pieces that fit on one line at 375px, and the fourth tab is
      past that count — a nav that wrapped would push the day's numbers off the
      screen on every phone, while one that scrolls costs nothing to anyone
      whose window is wide enough.
    */
    <nav
      aria-label={tc("office")}
      className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {LINKS.map((link) => {
        const current = owns(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-semibold transition sm:px-3 ${
              current
                ? "bg-[color:var(--accent-soft)] text-[color:var(--ink)]"
                : "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
            }`}
          >
            {tc(link.label)}
          </Link>
        );
      })}
    </nav>
  );
}
