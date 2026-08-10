import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexServer } from "@/lib/convexServer";
import { tc, tcf } from "@/lib/i18n";
import { isNarrowed, parseFilters, toQuery, toQueryArgs } from "@/lib/officeSearch";
import { ReportCard, type Card } from "@/components/office/ReportCard";
import { SearchFilters } from "@/components/office/SearchFilters";

/**
 * Search.
 *
 * The day board answers "what happened today". This answers everything else —
 * the report a client is asking about, every day one person was on a crew, what is
 * still sitting in `needs_review` from last month.
 *
 * The filters live in the URL and the page reads them back out, which means a
 * search has an address. That is the point: "every report Miguel filed last
 * week" becomes a link a PM sends to somebody rather than a set of boxes they
 * have to describe over the phone.
 *
 * Free text over the descriptions is deliberately not here. That needs a Convex
 * search index, it is its own decision, and it can be added later without
 * moving any of this.
 */
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const convex = convexServer();
  if (!convex) return null;

  const [results, accounts] = await Promise.all([
    convex.query(api.office.search, {
      ...toQueryArgs(filters),
      // The only filter the pure module cannot type, because it is a document id.
      ...(filters.submittedBy ? { submittedBy: filters.submittedBy as Id<"users"> } : {}),
    }),
    convex.query(api.office.accounts, {}),
  ]);

  const narrowed = isNarrowed(filters);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{tc("searchTitle")}</h1>
        <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">{tc("searchHint")}</p>
      </div>

      {/* Remounted whenever the URL changes, so the back button restores the
          boxes that produced the results underneath them. */}
      <SearchFilters key={toQuery(filters)} filters={filters} accounts={accounts} />

      <section className="flex flex-col gap-3" aria-live="polite">
        {results.reports.length > 0 && (
          <p className="text-sm font-semibold tabular-nums text-[color:var(--ink-muted)]">
            {results.reports.length === 1
              ? tc("resultsOne")
              : tcf("resultsMany", { n: results.reports.length })}
          </p>
        )}

        {/* Said out loud rather than trimmed in silence — a search that quietly
            dropped the older half would be answering a different question. */}
        {results.truncated && (
          <p className="rounded-lg border border-[color:var(--warn)]/40 bg-[color:var(--warn-soft)] px-3 py-2 text-sm font-medium text-[color:var(--warn)]">
            {tc("resultsTruncated")}
          </p>
        )}

        {results.reports.length === 0 ? (
          <div className="card p-6 text-center">
            {/* Two different empty states. Nothing matched a filter is something
                the reader can act on; nothing was filed at all is not. */}
            <p className="font-semibold">
              {narrowed ? tc("noResults") : tc("noResultsInRange")}
            </p>
            <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
              {narrowed ? tc("noResultsHint") : tc("noResultsInRangeHint")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {results.reports.map((card) => (
              <ReportCard key={card.id} card={card as Card} showDate />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
