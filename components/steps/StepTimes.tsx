"use client";

import { formatHours, onSiteHours, totalDayHours, travelHours } from "@/lib/calc";
import { t } from "@/lib/i18n";
import type { JobReport, Lang } from "@/lib/types";
import { Section, TimeField } from "../ui";

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

  return (
    <div className="space-y-4">
      <Section title={t("stepTimes", lang)}>
        <div className="grid grid-cols-2 gap-3">
          <TimeField
            label={t("startYard", lang)}
            value={report.startYard}
            onChange={(v) => update({ startYard: v })}
          />
          <TimeField
            label={t("startJob", lang)}
            value={report.startJob}
            onChange={(v) => update({ startJob: v })}
          />
          <TimeField
            label={t("endJob", lang)}
            value={report.endJob}
            onChange={(v) => update({ endJob: v })}
          />
          <TimeField
            label={t("endYard", lang)}
            value={report.endYard}
            onChange={(v) => update({ endYard: v })}
          />
        </div>
      </Section>

      {(total !== null || site !== null) && (
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label={t("totalHours", lang)} value={formatHours(total)} accent />
          <Stat label={t("onSiteHours", lang)} value={formatHours(site)} />
          <Stat label={t("travelHours", lang)} value={formatHours(travel)} />
        </div>
      )}
    </div>
  );
}
