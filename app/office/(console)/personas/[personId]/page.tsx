import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { CREW, ROLE_CODES } from "@/lib/catalog";
import { convexServer } from "@/lib/convexServer";
import { CONSOLE_LANG, tc } from "@/lib/i18n";
import { longDate, shiftDate, shortDate, startOfWeek, todayForOffice, weekRange } from "@/lib/officeDate";
import { hours } from "@/lib/officeFormat";

/**
 * One person's week.
 *
 * PLAN.md guesses this single screen may justify the project by itself, and the
 * reason is payroll: the hours one person worked are scattered across as many
 * reports as the crews they were on, and adding them up by hand out of a mailbox
 * is the job this replaces.
 *
 * It costs almost nothing to serve. `crewDays` was fanned out on write for
 * exactly this read, so a week is one indexed range over rows that already
 * exist — no report is opened to build it.
 *
 * Nothing here is recomputed from the reports. The hours shown are the hours
 * the foreman wrote down, and a day nobody wrote hours for stays blank rather
 * than becoming a confident zero: payroll acts on that difference.
 */
export const dynamic = "force-dynamic";

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };
const locale = LOCALE[CONSOLE_LANG] ?? "en-US";

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [{ personId: raw }, range] = await Promise.all([params, searchParams]);
  const personId = decodeURIComponent(raw);
  const { from, to } = weekRange(range.from, range.to);

  const rostered = CREW.find((member) => member.id === personId) ?? null;

  const convex = convexServer();
  if (!convex) return null;

  const week = await convex.query(api.office.personWeek, { personId, from, to });

  // A name a foreman typed in is stored with a null personId on purpose, so no
  // URL can reach one — anything unknown here is a stale link or a roster edit,
  // and neither is a person with a history to show.
  const name = rostered?.name ?? week.name;
  if (name === null) return <NotOnRoster />;

  return (
    <div className="flex flex-col gap-6">
      <WeekNav personId={personId} name={name} rostered={rostered} from={from} to={to} />

      <section aria-label={tc("personTitle")}>
        <dl className="grid grid-cols-3 gap-3">
          <Stat label={tc("totalHours")} value={hours(week.totalHours) ?? "0"} />
          <Stat label={tc("daysWorked")} value={String(week.daysWorked)} />
          <Stat
            label={tc("daysMissingHours")}
            value={String(week.daysMissingHours)}
            warn={week.daysMissingHours > 0}
          />
        </dl>

        {/* Under the row rather than inside the third card: a sentence wrapped
            into a third of a phone screen stretches all three cards to match
            it, and the two numbers beside it end up mostly white space. */}
        {week.daysMissingHours > 0 && (
          <p className="mt-2 text-sm text-[color:var(--warn)]">{tc("daysMissingHoursHint")}</p>
        )}
      </section>

      {week.days.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="font-semibold">{tc("noWorkInWeek")}</p>
          <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{tc("noWorkInWeekHint")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {week.days.map((day) => (
            <li key={day.date} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-[15px] font-bold tracking-tight">
                  <Link
                    href={`/office?date=${day.date}`}
                    className="rounded-md transition hover:text-[color:var(--ink-muted)]"
                  >
                    {shortDate(day.date, locale)}
                  </Link>
                </h2>

                {day.hours === null ? (
                  <span className="text-sm font-semibold text-[color:var(--warn)]">
                    {tc("noHoursRecorded")}
                  </span>
                ) : (
                  <span className="text-sm font-semibold tabular-nums">
                    {hours(day.hours)} {tc("hours")}
                  </span>
                )}
              </div>

              {/* One row per crew they were on that day. Two jobs in a day is two
                  rows, and they are what the day's hours were added up from. */}
              <ul className="mt-2 flex flex-col gap-1.5 border-t border-[color:var(--line)] pt-2 text-sm">
                {day.entries.map((entry) => (
                  <li key={entry._id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <Link
                      href={`/office/reportes/${entry.reportId}`}
                      title={tc("openReport")}
                      className="rounded-md font-medium underline decoration-[color:var(--line)] underline-offset-4 transition hover:decoration-[color:var(--ink)]"
                    >
                      {entry.clientName}
                    </Link>
                    {entry.jobNumber && (
                      <span className="text-[color:var(--ink-muted)]">
                        {tc("jobShort")} {entry.jobNumber}
                      </span>
                    )}
                    {entry.roles.length > 0 && (
                      <span className="text-xs text-[color:var(--ink-muted)]">
                        {entry.roles.map(roleName).join(", ")}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 tabular-nums">
                      {hours(entry.hours) ?? (
                        <span className="text-xs font-medium text-[color:var(--warn)]">
                          {tc("noHoursRecorded")}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** A role code as it is printed on the paper form, spelled out. */
function roleName(code: string): string {
  return ROLE_CODES[code]?.[CONSOLE_LANG] ?? code;
}

/**
 * Moving between weeks, and out to every report this person was on.
 *
 * Plain links, like the day board's: the range is in the URL, so a week
 * survives a reload and can be pasted to somebody else.
 */
function WeekNav({
  personId,
  name,
  rostered,
  from,
  to,
}: {
  personId: string;
  name: string;
  rostered: { roles: string[] } | null;
  from: string;
  to: string;
}) {
  const thisWeek = startOfWeek(todayForOffice());
  const showing = startOfWeek(from);

  const link = (start: string) => {
    const params = new URLSearchParams({ from: start, to: shiftDate(start, 6) });
    return `/office/personas/${encodeURIComponent(personId)}?${params.toString()}`;
  };

  // Every report they were on, reached with the range already filled in — the
  // question a week almost always turns into.
  const allReports = `/office/reportes?${new URLSearchParams({ from, to, person: personId }).toString()}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
          <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">
            {rostered && rostered.roles.length > 0
              ? `${rostered.roles.map(roleName).join(", ")} · `
              : ""}
            {longDate(from, locale)} – {longDate(to, locale)}
          </p>
        </div>

        <Link
          href={allReports}
          className="min-h-9 shrink-0 rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-1.5 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("seeAllReports")}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <WeekLink to={link(shiftDate(showing, -7))} label={tc("previousWeek")} direction="prev" />
        <WeekLink to={link(shiftDate(showing, 7))} label={tc("nextWeek")} direction="next" />
        {showing !== thisWeek && (
          <Link
            href={link(thisWeek)}
            className="min-h-9 rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-1.5 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
          >
            {tc("thisWeek")}
          </Link>
        )}
        <p className="text-sm text-[color:var(--ink-muted)]">{tc("personHint")}</p>
      </div>
    </div>
  );
}

function WeekLink({
  to,
  label,
  direction,
}: {
  to: string;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <Link
      href={to}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] border-[color:var(--line)] transition hover:bg-[color:var(--accent-soft)]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={direction === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`card p-4 ${warn ? "border-[color:var(--warn)]/50" : ""}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-[color:var(--ink-muted)]">
        {label}
      </dt>
      <dd
        className={`mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
          warn ? "text-[color:var(--warn)]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function NotOnRoster() {
  return (
    <div className="card p-6 text-center">
      <p className="font-semibold">{tc("unknownPerson")}</p>
      <p className="mx-auto mt-1 max-w-prose text-sm text-[color:var(--ink-muted)]">
        {tc("unknownPersonHint")}
      </p>
      <Link
        href="/office"
        className="mt-4 inline-block rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-2 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
      >
        {tc("backToDay")}
      </Link>
    </div>
  );
}
