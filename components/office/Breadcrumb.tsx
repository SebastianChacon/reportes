import Link from "next/link";
import { tc } from "@/lib/i18n";

/**
 * Where this screen hangs from, and the way back up.
 *
 * Four routes in the console sit two levels deep — a report, one person's week,
 * a client's file, the advanced summary — and none of them had a path back other
 * than the browser's own button. That is fine until somebody arrives from a link
 * a colleague sent, at which point the back button leads out of the product.
 *
 * The last item is the current page and is not a link, per the usual reading of
 * a breadcrumb: it says where you are, not somewhere you can go.
 *
 * `aria-current="page"` on that last item rather than colour, so the answer to
 * "which of these am I on" survives without hue — which on this console it has
 * to, since there is none.
 */
export type Crumb = { label: string; href?: string };

export function Breadcrumb({ trail }: { trail: Crumb[] }) {
  if (trail.length === 0) return null;

  return (
    <nav aria-label={tc("breadcrumb")}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {trail.map((crumb, at) => {
          const last = at === trail.length - 1;

          return (
            <li key={`${crumb.label}-${at}`} className="flex items-center gap-1.5">
              {at > 0 && (
                <span aria-hidden="true" className="text-[color:var(--ink-muted)]">
                  /
                </span>
              )}

              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="rounded text-[color:var(--ink-muted)] underline decoration-[color:var(--line)] underline-offset-4 transition hover:text-[color:var(--ink)] hover:decoration-[color:var(--ink)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "font-semibold" : "text-[color:var(--ink-muted)]"}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
