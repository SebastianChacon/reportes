import Link from "next/link";
import { CONSOLE_LANG, tc, tcf, type ConsoleKey } from "@/lib/i18n";
import { shortDate } from "@/lib/officeDate";
import { lengthInDays, PRESETS, type Period, type PresetId } from "@/lib/officePeriod";

/**
 * One filter row, above everything it scopes.
 *
 * Not per-chart controls and not a control inside a card: every chart on the
 * screen describes the same stretch of time, and a screen where two of them
 * could be showing different months is a screen that cannot be trusted at a
 * glance.
 *
 * Presets are links and the custom range is a plain GET form, so the whole
 * control needs no client JavaScript and the period ends up in the URL either
 * way — which is what makes a summary something you can send to somebody.
 */

const LABEL: Record<PresetId, ConsoleKey> = {
  week: "periodWeek",
  "4w": "period4w",
  "6w": "period6w",
  month: "periodMonth",
};

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };

export function PeriodNav({ period, basePath }: { period: Period; basePath: string }) {
  const locale = LOCALE[CONSOLE_LANG] ?? "en-US";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <nav aria-label={tc("period")} className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => {
            const current = period.preset === preset;
            return (
              <Link
                key={preset}
                href={`${basePath}?p=${preset}`}
                aria-current={current ? "true" : undefined}
                className={`min-h-9 rounded-lg border-[1.5px] px-3 py-1.5 text-sm font-semibold transition ${
                  current
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--ink)]"
                    : "border-[color:var(--line)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
                }`}
              >
                {tc(LABEL[preset])}
              </Link>
            );
          })}
        </nav>

        {/* What the buttons above resolved to, said in dates. A preset that
            silently means something different next Monday is only honest if the
            screen shows the dates it landed on. */}
        <p className="text-sm tabular-nums text-[color:var(--ink-muted)]">
          {shortDate(period.from, locale)} — {shortDate(period.to, locale)}
          <span className="ml-2">· {tcf("periodDays", { n: lengthInDays(period) })}</span>
        </p>
      </div>

      {/* A plain GET form: submitting it navigates, so the range lands in the
          URL exactly as a preset link would, with no state to keep in sync. */}
      <form
        action={basePath}
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-xl border border-[color:var(--line)] p-2.5"
      >
        <DateField name="from" label={tc("periodFrom")} value={period.from} />
        <DateField name="to" label={tc("periodTo")} value={period.to} />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-[color:var(--accent)] px-4 text-sm font-semibold text-[color:var(--accent-contrast)] transition hover:bg-[color:var(--accent-hover)]"
        >
          {tc("periodApply")}
        </button>
      </form>
    </div>
  );
}

function DateField({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-[color:var(--ink-muted)]">
      {label}
      <input
        type="date"
        name={name}
        defaultValue={value}
        className="field min-h-11 w-[10.5rem] py-2 text-sm"
      />
    </label>
  );
}
