"use client";

import {
  formatHours,
  LUNCH_CHOICES,
  lunchMinutes,
  onSiteHours,
  timeErrors,
  totalDayHours,
  travelHours,
  type TimeFieldName,
} from "@/lib/calc";
import { t, UI } from "@/lib/i18n";
import type { JobReport, Lang } from "@/lib/types";
import { EmptyNote, Section, TimeField } from "../ui";

/** Label of each checkpoint, so an error can name the one it must follow. */
const FIELD_LABEL: Record<TimeFieldName, keyof typeof UI> = {
  startYard: "startYard",
  startJob: "startJob",
  endJob: "endJob",
  endYard: "endYard",
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-sunk)] px-3 py-2.5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-xl font-bold tabular-nums ${
          accent ? "text-[color:var(--accent)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function StepTimes({
  report,
  lang,
  update,
}: {
  report: JobReport;
  lang: Lang;
  update: (patch: Partial<JobReport>) => void;
}) {
  const total = totalDayHours(report);
  const site = onSiteHours(report);
  const travel = travelHours(report);
  const lunch = lunchMinutes(report);

  const errors = timeErrors(report);
  const errorFor = (field: TimeFieldName): string | undefined => {
    const hit = errors.find((e) => e.field === field);
    if (!hit) return undefined;
    return t("errNotBefore", lang).replace("{prev}", t(FIELD_LABEL[hit.after], lang));
  };

  return (
    <div className="space-y-4">
      <Section title={t("stepTimes", lang)}>
        {/* One per row on a phone: the native time control plus the "Now"
            shortcut do not both fit in a 150px column. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TimeField
            label={t("startYard", lang)}
            nowLabel={t("now", lang)}
            value={report.startYard}
            error={errorFor("startYard")}
            onChange={(v) => update({ startYard: v })}
          />
          <TimeField
            label={t("startJob", lang)}
            nowLabel={t("now", lang)}
            value={report.startJob}
            error={errorFor("startJob")}
            onChange={(v) => update({ startJob: v })}
          />
          <TimeField
            label={t("endJob", lang)}
            nowLabel={t("now", lang)}
            value={report.endJob}
            error={errorFor("endJob")}
            onChange={(v) => update({ endJob: v })}
          />
          <TimeField
            label={t("endYard", lang)}
            nowLabel={t("now", lang)}
            value={report.endYard}
            error={errorFor("endYard")}
            onChange={(v) => update({ endYard: v })}
          />
        </div>
      </Section>

      <Section title={t("lunch", lang)} hint={t("lunchHint", lang)}>
        <div
          role="radiogroup"
          aria-label={t("lunch", lang)}
          className="grid grid-cols-4 gap-2"
        >
          {LUNCH_CHOICES.map((minutes) => {
            const active = lunch === minutes;
            return (
              <button
                key={minutes}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ lunchMinutes: minutes })}
                className={`touch-target whitespace-nowrap rounded-xl border-[1.5px] px-2 text-sm font-semibold transition active:scale-[0.98] ${
                  active
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                    : "border-[color:var(--line)] text-[color:var(--ink-muted)]"
                }`}
              >
                {minutes} {t("minutesShort", lang)}
              </button>
            );
          })}
        </div>
      </Section>

      {total === null && site === null ? (
        <EmptyNote>{t("timesEmpty", lang)}</EmptyNote>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label={t("totalHours", lang)} value={formatHours(total)} accent />
          <Stat label={t("onSiteHours", lang)} value={formatHours(site)} />
          <Stat label={t("travelHours", lang)} value={formatHours(travel)} />
        </div>
      )}

      {errors.length > 0 && (
        <p className="alert rounded-xl px-3 py-2.5 text-sm font-semibold text-[color:var(--danger)]">
          {t("timesFixFirst", lang)}
        </p>
      )}
    </div>
  );
}
