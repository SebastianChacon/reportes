"use client";

import React from "react";
import { CREW, CREW_GROUPS, ROLE_CODES } from "@/lib/catalog";
import { crewTotalHours, formatHours, suggestedCrewHours } from "@/lib/calc";
import { t } from "@/lib/i18n";
import { loadLastCrew } from "@/lib/storage";
import type { CrewEntry, JobReport, Lang } from "@/lib/types";
import { SearchPicker, type PickerOption } from "../SearchPicker";
import { Button, EmptyNote, IconTrash, NumberField, Section } from "../ui";

export function StepCrew({
  report,
  lang,
  update,
}: {
  report: JobReport;
  lang: Lang;
  update: (patch: Partial<JobReport>) => void;
}) {
  // What the day's times work out to — the hours almost everyone gets.
  const suggested = suggestedCrewHours(report);

  const [bulkHours, setBulkHours] = React.useState<number | null>(suggested);
  // Once the foreman types his own number, the times stop overwriting it.
  const [bulkEdited, setBulkEdited] = React.useState(false);
  const [lastCrew, setLastCrew] = React.useState<CrewEntry[]>([]);

  React.useEffect(() => {
    setLastCrew(loadLastCrew());
  }, []);

  // Going back to fix a time should move the suggestion with it.
  React.useEffect(() => {
    if (!bulkEdited) setBulkHours(suggested);
  }, [suggested, bulkEdited]);

  const editBulkHours = (hours: number | null) => {
    setBulkEdited(true);
    setBulkHours(hours);
  };

  /** Hours a newly added person starts with. */
  const defaultHours = bulkHours ?? suggested;

  const roleText = (roles: string[]) =>
    roles.map((c) => ROLE_CODES[c]?.[lang] ?? c).join(" · ");

  const options: PickerOption[] = React.useMemo(
    () =>
      CREW.map((m) => ({
        id: m.id,
        title: m.name,
        subtitle: `${roleText(m.roles)} — ${CREW_GROUPS[m.group][lang]}`,
        keywords: m.roles.join(" "),
      })),
    [lang]
  );

  const addMember = (option: PickerOption) => {
    const source = CREW.find((m) => m.id === option.id);
    if (!source || report.crew.some((c) => c.id === option.id)) return;
    update({
      crew: [
        ...report.crew,
        { id: source.id, name: source.name, roles: source.roles, hours: defaultHours },
      ],
    });
  };

  const addCustom = (name: string) => {
    const id = `adhoc-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    update({
      crew: [...report.crew, { id, name, roles: [], hours: defaultHours, adhoc: true }],
    });
  };

  const setHours = (id: string, hours: number | null) => {
    update({ crew: report.crew.map((c) => (c.id === id ? { ...c, hours } : c)) });
  };

  const applyToAll = () => {
    if (bulkHours === null) return;
    update({ crew: report.crew.map((c) => ({ ...c, hours: bulkHours })) });
  };

  const removeMember = (id: string) => {
    update({ crew: report.crew.filter((c) => c.id !== id) });
  };

  const reuseLastCrew = () => {
    // Bring the people over, but on today's hours — never yesterday's.
    update({ crew: lastCrew.map((c) => ({ ...c, hours: defaultHours })) });
  };

  return (
    <div className="space-y-4">
      <Section
        title={t("stepCrew", lang)}
        action={
          lastCrew.length > 0 && report.crew.length === 0 ? (
            <Button variant="ghost" onClick={reuseLastCrew} className="!min-h-9 !px-2 !text-xs">
              {t("useYesterday", lang)}
            </Button>
          ) : undefined
        }
      >
        <SearchPicker
          placeholder={t("crewSearch", lang)}
          options={options}
          selectedIds={report.crew.map((c) => c.id)}
          onPick={addMember}
          onAddCustom={addCustom}
          addCustomLabel={t("addAsNew", lang)}
          noResultsLabel={t("noResults", lang)}
        />
      </Section>

      <Section
        title={t("crewAdded", lang)}
        hint={report.crew.length > 0 ? t("applyHoursHint", lang) : undefined}
      >
        {report.crew.length === 0 ? (
          <EmptyNote>{t("crewNoneYet", lang)}</EmptyNote>
        ) : (
          <>
            {/* Every crew member usually works the same day — set it once. */}
            <div className="mb-4 rounded-xl bg-[color:var(--surface-sunk)] p-3">
              <div className="flex items-end gap-2">
                <div className="w-28 shrink-0">
                  <NumberField
                    compact
                    label={t("hours", lang)}
                    placeholder={t("hrs", lang)}
                    value={bulkHours}
                    onChange={editBulkHours}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={applyToAll}
                  disabled={bulkHours === null}
                  className="flex-1"
                >
                  {t("applyToAll", lang)}
                </Button>
              </div>
              <p className="mt-2 text-xs text-[color:var(--ink-muted)]">
                {suggested === null
                  ? t("hoursNoTimes", lang)
                  : t("hoursFromTimes", lang).replace("{n}", formatHours(suggested))}
              </p>
            </div>

            <ul className="space-y-2">
              {report.crew.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2.5 rounded-xl border border-[color:var(--line)] p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{member.name}</p>
                    <p className="truncate text-xs text-[color:var(--ink-muted)]">
                      {member.adhoc ? t("addPerson", lang) : roleText(member.roles)}
                    </p>
                  </div>
                  <div className="w-20 shrink-0">
                    <NumberField
                      compact
                      label={`${t("hours", lang)} — ${member.name}`}
                      placeholder={t("hrs", lang)}
                      value={member.hours}
                      onChange={(v) => setHours(member.id, v)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`${t("remove", lang)} ${member.name}`}
                    onClick={() => removeMember(member.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[color:var(--ink-muted)]"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-right text-sm font-semibold">
              {t("crewTotal", lang)}:{" "}
              <span className="tabular-nums text-[color:var(--accent)]">
                {formatHours(crewTotalHours(report))} {t("hrs", lang)}
              </span>
            </p>
          </>
        )}
      </Section>
    </div>
  );
}
