"use client";

import React from "react";
import { dayOfWeek, t } from "@/lib/i18n";
import { loadLastJobInfo, type LastJobInfo } from "@/lib/storage";
import type { JobReport, Lang } from "@/lib/types";
import { Button, IconPlus, Section, TextField } from "../ui";

/** Repeating short values (job #s, truck #s) as add-and-remove chips. */
function ChipList({
  label,
  placeholder,
  addLabel,
  removeLabel,
  values,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  values: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
}) {
  const [draft, setDraft] = React.useState("");
  const inputId = React.useId();

  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-[color:var(--danger)]">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          className="field"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
        <Button type="button" onClick={add} aria-label={addLabel} className="shrink-0 !px-4">
          <IconPlus />
        </Button>
      </div>
      {values.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {values.map((v) => (
            <li key={v}>
              <span className="chip">
                <span className="font-semibold">#{v}</span>
                <button
                  type="button"
                  aria-label={`${removeLabel} ${v}`}
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  className="-mr-1 flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink-muted)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StepJob({
  report,
  lang,
  update,
}: {
  report: JobReport;
  lang: Lang;
  update: (patch: Partial<JobReport>) => void;
}) {
  const dateId = React.useId();
  const [lastJob, setLastJob] = React.useState<LastJobInfo | null>(null);

  React.useEffect(() => {
    setLastJob(loadLastJobInfo());
  }, []);

  const useYesterdayJob = () => {
    if (!lastJob) return;
    update({
      clientName: lastJob.clientName,
      jobNumbers: lastJob.jobNumbers,
      truckNumbers: lastJob.truckNumbers,
    });
  };

  const canUseYesterday = Boolean(lastJob) && !report.clientName.trim() && report.jobNumbers.length === 0;

  return (
    <div className="space-y-4">
      <Section
        title={t("stepJob", lang)}
        action={
          canUseYesterday ? (
            <Button variant="ghost" onClick={useYesterdayJob} className="!min-h-9 !px-2 !text-xs">
              {t("useYesterdayJob", lang)}
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={dateId} className="mb-1.5 block text-sm font-medium">
              {t("date", lang)}
              <span className="ml-1 text-[color:var(--danger)]">*</span>
            </label>
            <input
              id={dateId}
              className="field"
              type="date"
              value={report.date}
              onChange={(e) => update({ date: e.target.value })}
            />
            {report.date && (
              <p className="mt-1.5 text-xs font-medium text-[color:var(--accent)]">
                {dayOfWeek(report.date, lang)}
              </p>
            )}
          </div>

          <TextField
            label={t("clientName", lang)}
            placeholder={t("clientNamePlaceholder", lang)}
            required
            value={report.clientName}
            autoComplete="off"
            onChange={(v) => update({ clientName: v })}
          />

          <ChipList
            label={t("jobNumbers", lang)}
            placeholder={t("jobNumberPlaceholder", lang)}
            addLabel={t("add", lang)}
            removeLabel={t("remove", lang)}
            values={report.jobNumbers}
            onChange={(v) => update({ jobNumbers: v })}
            required
          />

          <ChipList
            label={t("truckNumbers", lang)}
            placeholder={t("truckNumberPlaceholder", lang)}
            addLabel={t("add", lang)}
            removeLabel={t("remove", lang)}
            values={report.truckNumbers}
            onChange={(v) => update({ truckNumbers: v })}
          />
        </div>
      </Section>
    </div>
  );
}
