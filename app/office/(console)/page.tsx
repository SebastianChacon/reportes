import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import { tc, tcf } from "@/lib/i18n";
import { dateFromParam } from "@/lib/officeDate";
import { hours, money } from "@/lib/officeFormat";
import { DayNav } from "@/components/office/DayNav";
import { ReportCard, type Card } from "@/components/office/ReportCard";

/**
 * The day.
 *
 * The default screen, and the one the console was justified by. Four numbers,
 * who has not filed, then every report — in that order, because that is the
 * order a project manager asks the questions in at 5pm.
 *
 * Always fresh: a board cached for even a minute would tell someone a report
 * had not arrived when it had, which is the one thing this screen must never do.
 */
export const dynamic = "force-dynamic";

export default async function DayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: raw } = await searchParams;
  const date = dateFromParam(raw);

  const convex = convexServer();
  // The layout's gate already refuses to render this without a deployment
  // configured, so reaching here with none would be a bug rather than a state.
  if (!convex) return null;

  const [board, missing] = await Promise.all([
    convex.query(api.office.dayBoard, { date }),
    convex.query(api.office.missingToday, { date }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <DayNav date={date} />

      <section aria-label={tc("theDay")}>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={tc("reportsReceived")} value={String(board.summary.reports)} />
          <Stat label={tc("peopleOnSite")} value={String(board.summary.people)} />
          <Stat label={tc("labourHours")} value={hours(board.summary.crewHours) ?? "0"} />
          <Stat label={tc("materialsSpend")} value={money(board.summary.materialsCost)} />
        </dl>
      </section>

      <MissingPanel missing={missing} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">
          {tc("reports")}
        </h2>

        {board.reports.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="font-semibold">{tc("noReports")}</p>
            <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{tc("noReportsHint")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {board.reports.map((card) => (
              <ReportCard key={card.id} card={card as Card} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-[color:var(--ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{value}</dd>
    </div>
  );
}

/**
 * "Not filed yet" — what a mailbox structurally cannot tell you.
 *
 * The empty state is deliberately not "no data": a day where everyone filed is
 * good news and should read as good news, and a day where nobody has an account
 * is a different thing entirely, which it says instead of showing a clean list
 * that means nothing.
 */
function MissingPanel({
  missing,
}: {
  missing: {
    missing: { userId: string; name: string; crewMemberId: string }[];
    enrolled: number;
    filed: number;
    unattributed: number;
  };
}) {
  const nobodyEnrolled = missing.enrolled === 0;

  return (
    <section
      className={`card p-4 sm:p-5 ${
        missing.missing.length > 0 ? "border-[color:var(--warn)]/50" : ""
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-bold tracking-tight">{tc("missingTitle")}</h2>
        {!nobodyEnrolled && (
          <p className="text-sm tabular-nums text-[color:var(--ink-muted)]">
            {tcf("enrolledCount", { filed: missing.filed, enrolled: missing.enrolled })}
          </p>
        )}
      </div>

      {nobodyEnrolled ? (
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">{tc("missingNobodyEnrolled")}</p>
      ) : missing.missing.length === 0 ? (
        <p className="mt-2 text-sm text-[color:var(--ok)]">{tc("missingNone")}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{tc("missingHint")}</p>
          {/* Each name goes to that man's week. "He did not file today" is
              almost always followed by "what has he been doing", and the answer
              is one click away rather than a search somebody has to construct.
              The link is by roster id, not account id — a week is built from
              crew rows, which is who was on the job rather than who has a PIN. */}
          <ul className="mt-3 flex flex-wrap gap-2">
            {missing.missing.map((foreman) => (
              <li key={foreman.userId}>
                <Link
                  href={`/office/personas/${encodeURIComponent(foreman.crewMemberId)}`}
                  className="chip font-semibold transition hover:border-[color:var(--ink-muted)]"
                >
                  {foreman.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The honest limit, on the screen rather than in the plan: a report with
          no foreman on it cannot clear anyone from the list above. */}
      {missing.unattributed > 0 && (
        <p className="mt-3 border-t border-[color:var(--line)] pt-3 text-sm text-[color:var(--ink-muted)]">
          {missing.unattributed === 1
            ? tc("unattributedNoteOne")
            : tcf("unattributedNoteMany", { n: missing.unattributed })}
        </p>
      )}
    </section>
  );
}
