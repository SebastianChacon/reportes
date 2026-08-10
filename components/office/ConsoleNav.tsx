"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tc } from "@/lib/i18n";

/**
 * The two places the console goes.
 *
 * A client component only so the current page can say it is the current page —
 * `aria-current` rather than colour alone, so the answer to "where am I" does
 * not depend on telling two greys apart.
 */
const LINKS = [
  { href: "/office", label: "navDay" },
  { href: "/office/reportes", label: "navSearch" },
] as const;

export function ConsoleNav() {
  const pathname = usePathname();

  return (
    <nav aria-label={tc("office")} className="flex items-center gap-1">
      {LINKS.map((link) => {
        // A report's own page belongs to search only in the URL; it is reached
        // from either side, so neither tab claims it.
        const current = pathname === link.href;

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
