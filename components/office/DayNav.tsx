import Link from "next/link";
import { tc } from "@/lib/i18n";
import { CONSOLE_LANG } from "@/lib/i18n";
import { longDate, shiftDate, todayForOffice } from "@/lib/officeDate";

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };

/**
 * Moving between days.
 *
 * Plain links rather than a date picker with client state: the day is in the
 * URL, so this survives a reload, a back button, and being pasted into a
 * WhatsApp — which is how a report gets discussed here.
 *
 * Forward past today is possible on purpose. Reports carry the date the
 * foreman's phone was on, and a phone an hour ahead of the office files into
 * tomorrow; a console that refused to look there would simply lose the report.
 */
export function DayNav({ date }: { date: string }) {
  const today = todayForOffice();
  const locale = LOCALE[CONSOLE_LANG] ?? "en-US";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-1">
        <DayLink to={shiftDate(date, -1)} label={tc("previousDay")} direction="prev" />
        <DayLink to={shiftDate(date, 1)} label={tc("nextDay")} direction="next" />
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {date === today ? tc("today") : longDate(date, locale)}
        </h1>
        <p className="text-sm text-[color:var(--ink-muted)]">
          {date === today ? longDate(date, locale) : date}
        </p>
      </div>

      {date !== today && (
        <Link
          href="/office"
          className="ml-auto min-h-9 rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-1.5 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("backToToday")}
        </Link>
      )}
    </div>
  );
}

function DayLink({
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
      href={`/office?date=${to}`}
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
