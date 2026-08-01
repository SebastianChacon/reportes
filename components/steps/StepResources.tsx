"use client";

import React from "react";
import { EQUIPMENT, MATERIALS, PLANT_CATEGORIES, SUBCONTRACTOR_TRADES, TRUCKS } from "@/lib/catalog";
import { formatMoney, materialsTotalCost } from "@/lib/calc";
import { t } from "@/lib/i18n";
import type {
  EquipmentEntry,
  JobReport,
  Lang,
  MaterialEntry,
  PlantEntry,
  SubcontractorEntry,
  TruckEntry,
} from "@/lib/types";
import { SearchPicker, type PickerOption } from "../SearchPicker";
import { Button, EmptyNote, IconPlus, IconTrash, NumberField, TextField, Toggle } from "../ui";

/** Collapsed by default: the foreman opens only the sections that apply today. */
function Accordion({
  title,
  hint,
  count,
  children,
  defaultOpen,
}: {
  title: string;
  hint?: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  const panelId = React.useId();

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full touch-target items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold tracking-tight">{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-xs font-bold tabular-nums text-white">
              {count}
            </span>
          )}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-[color:var(--ink-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="border-t border-[color:var(--line)] px-4 py-4">
          {hint && (
            <p className="mb-3 rounded-lg bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-medium text-[color:var(--accent)]">
              {hint}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

function RowShell({
  title,
  subtitle,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-[color:var(--line)] p-3">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        <button
          type="button"
          aria-label={`${removeLabel} ${title}`}
          onClick={onRemove}
          className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[color:var(--ink-muted)]"
        >
          <IconTrash />
        </button>
      </div>
      {children}
    </li>
  );
}

export function StepResources({
  report,
  lang,
  update,
}: {
  report: JobReport;
  lang: Lang;
  update: (patch: Partial<JobReport>) => void;
}) {
  /* ---------------- equipment ---------------- */

  const equipmentOptions: PickerOption[] = EQUIPMENT.map((e) => ({
    id: e.id,
    title: e.label[lang],
    keywords: `${e.label.en} ${e.label.es}`,
  }));

  const addEquipment = (opt: PickerOption) => {
    const src = EQUIPMENT.find((e) => e.id === opt.id);
    if (!src) return;
    const entry: EquipmentEntry = {
      id: src.id,
      label: src.label,
      owner: "BTN",
      qty: null,
      hours: null,
    };
    update({ equipment: [...report.equipment, entry] });
  };

  const addCustomEquipment = (text: string) => {
    const entry: EquipmentEntry = {
      id: `adhoc-eq-${Date.now()}`,
      label: { en: text, es: text },
      owner: "RENTAL",
      qty: null,
      hours: null,
      adhoc: true,
    };
    update({ equipment: [...report.equipment, entry] });
  };

  const patchEquipment = (id: string, patch: Partial<EquipmentEntry>) =>
    update({ equipment: report.equipment.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  /* ---------------- materials ---------------- */

  const materialOptions: PickerOption[] = MATERIALS.map((m) => ({
    id: m.id,
    title: m.label[lang],
    keywords: `${m.label.en} ${m.label.es}`,
  }));

  const addMaterial = (opt: PickerOption) => {
    const src = MATERIALS.find((m) => m.id === opt.id);
    if (!src) return;
    const entry: MaterialEntry = {
      id: src.id,
      label: src.label,
      source: "BTN",
      qty: null,
      cost: null,
    };
    update({ materials: [...report.materials, entry] });
  };

  // The paper form has blank material rows precisely for this case.
  const addCustomMaterial = (text: string) => {
    const entry: MaterialEntry = {
      id: `adhoc-mat-${Date.now()}`,
      label: { en: text, es: text },
      source: "OTHER",
      qty: null,
      cost: null,
      adhoc: true,
    };
    update({ materials: [...report.materials, entry] });
  };

  const patchMaterial = (id: string, patch: Partial<MaterialEntry>) =>
    update({ materials: report.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  /* ---------------- plants ---------------- */

  const addPlant = () => {
    const entry: PlantEntry = {
      id: `plant-${Date.now()}`,
      category: "shrub",
      name: "",
      qty: null,
      size: "",
      vendor: "",
      cost: null,
    };
    update({ plants: [...report.plants, entry] });
  };

  const patchPlant = (id: string, patch: Partial<PlantEntry>) =>
    update({ plants: report.plants.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  /* ---------------- subcontractors ---------------- */

  const addSub = () => {
    const first = SUBCONTRACTOR_TRADES[0];
    const entry: SubcontractorEntry = {
      id: `sub-${Date.now()}`,
      trade: first.id,
      tradeLabel: first.label,
      vendor: "",
      description: "",
    };
    update({ subcontractors: [...report.subcontractors, entry] });
  };

  const patchSub = (id: string, patch: Partial<SubcontractorEntry>) =>
    update({
      subcontractors: report.subcontractors.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  /* ---------------- trucks ---------------- */

  const toggleTruck = (id: string) => {
    const existing = report.trucks.find((tr) => tr.id === id);
    if (existing) {
      update({ trucks: report.trucks.filter((tr) => tr.id !== id) });
      return;
    }
    const src = TRUCKS.find((tr) => tr.id === id);
    if (!src) return;
    const entry: TruckEntry = { id: src.id, label: src.label, hours: null };
    update({ trucks: [...report.trucks, entry] });
  };

  const patchTruck = (id: string, hours: number | null) =>
    update({ trucks: report.trucks.map((tr) => (tr.id === id ? { ...tr, hours } : tr)) });

  const total = materialsTotalCost(report);

  return (
    <div className="space-y-3">
      {/* ---------------- Equipment ---------------- */}
      <Accordion title={t("equipment", lang)} count={report.equipment.length} hint={t("ownerHint", lang)}>
        <SearchPicker
          placeholder={t("equipmentSearch", lang)}
          options={equipmentOptions}
          selectedIds={report.equipment.map((e) => e.id)}
          onPick={addEquipment}
          onAddCustom={addCustomEquipment}
          addCustomLabel={t("addAsNew", lang)}
          noResultsLabel={t("noResults", lang)}
        />
        {report.equipment.length > 0 && (
          <ul className="mt-3 space-y-2">
            {report.equipment.map((e) => (
              <RowShell
                key={e.id}
                title={e.label[lang]}
                removeLabel={t("remove", lang)}
                onRemove={() =>
                  update({ equipment: report.equipment.filter((x) => x.id !== e.id) })
                }
                subtitle={
                  <Toggle
                    ariaLabel={`${t("owned", lang)} / ${t("rental", lang)} — ${e.label[lang]}`}
                    value={e.owner}
                    onChange={(owner) => patchEquipment(e.id, { owner })}
                    options={[
                      { value: "BTN", label: t("owned", lang) },
                      { value: "RENTAL", label: t("rental", lang) },
                    ]}
                  />
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    compact
                    step="1"
                    label={`${t("qty", lang)} — ${e.label[lang]}`}
                    placeholder={t("qty", lang)}
                    value={e.qty}
                    onChange={(qty) => patchEquipment(e.id, { qty })}
                  />
                  <NumberField
                    compact
                    label={`${t("hrs", lang)} — ${e.label[lang]}`}
                    placeholder={t("hrs", lang)}
                    value={e.hours}
                    onChange={(hours) => patchEquipment(e.id, { hours })}
                  />
                </div>
              </RowShell>
            ))}
          </ul>
        )}
      </Accordion>

      {/* ---------------- Materials ---------------- */}
      <Accordion title={t("materials", lang)} count={report.materials.length}>
        <SearchPicker
          placeholder={t("materialsSearch", lang)}
          options={materialOptions}
          selectedIds={report.materials.map((m) => m.id)}
          onPick={addMaterial}
          onAddCustom={addCustomMaterial}
          addCustomLabel={t("addAsNew", lang)}
          noResultsLabel={t("noResults", lang)}
        />
        {report.materials.length > 0 && (
          <ul className="mt-3 space-y-2">
            {report.materials.map((m) => (
              <RowShell
                key={m.id}
                title={m.label[lang]}
                removeLabel={t("remove", lang)}
                onRemove={() => update({ materials: report.materials.filter((x) => x.id !== m.id) })}
                subtitle={
                  <Toggle
                    ariaLabel={`${t("owned", lang)} / ${t("other", lang)} — ${m.label[lang]}`}
                    value={m.source}
                    onChange={(source) => patchMaterial(m.id, { source })}
                    options={[
                      { value: "BTN", label: t("owned", lang) },
                      { value: "OTHER", label: t("other", lang) },
                    ]}
                  />
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    compact
                    step="0.5"
                    label={`${t("qty", lang)} — ${m.label[lang]}`}
                    placeholder={t("qty", lang)}
                    value={m.qty}
                    onChange={(qty) => patchMaterial(m.id, { qty })}
                  />
                  <NumberField
                    compact
                    step="0.01"
                    prefix="$"
                    label={`${t("cost", lang)} — ${m.label[lang]}`}
                    placeholder={t("cost", lang)}
                    value={m.cost}
                    onChange={(cost) => patchMaterial(m.id, { cost })}
                  />
                </div>
              </RowShell>
            ))}
          </ul>
        )}
      </Accordion>

      {/* ---------------- Plants ---------------- */}
      <Accordion title={t("plants", lang)} count={report.plants.length} hint={t("plantsHint", lang)}>
        {report.plants.length === 0 ? (
          <EmptyNote>{t("nothingHere", lang)}</EmptyNote>
        ) : (
          <ul className="space-y-2">
            {report.plants.map((p) => (
              <RowShell
                key={p.id}
                title={p.name || t("plantName", lang)}
                removeLabel={t("remove", lang)}
                onRemove={() => update({ plants: report.plants.filter((x) => x.id !== p.id) })}
                subtitle={
                  <div className="flex flex-wrap gap-1.5">
                    {PLANT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => patchPlant(p.id, { category: cat.id })}
                        aria-pressed={p.category === cat.id}
                        className={`min-h-9 rounded-full border-[1.5px] px-3 text-xs font-semibold transition ${
                          p.category === cat.id
                            ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                            : "border-[color:var(--line)] text-[color:var(--ink-muted)]"
                        }`}
                      >
                        {cat.label[lang]}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="space-y-2">
                  <TextField
                    label={t("plantName", lang)}
                    placeholder={t("plantName", lang)}
                    value={p.name}
                    onChange={(name) => patchPlant(p.id, { name })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      compact
                      step="1"
                      label={`${t("qty", lang)} — ${p.name}`}
                      placeholder={t("qty", lang)}
                      value={p.qty}
                      onChange={(qty) => patchPlant(p.id, { qty })}
                    />
                    <input
                      className="field"
                      placeholder={t("size", lang)}
                      aria-label={`${t("size", lang)} — ${p.name}`}
                      value={p.size}
                      onChange={(e) => patchPlant(p.id, { size: e.target.value })}
                    />
                    <input
                      className="field"
                      placeholder={t("vendor", lang)}
                      aria-label={`${t("vendor", lang)} — ${p.name}`}
                      value={p.vendor}
                      onChange={(e) => patchPlant(p.id, { vendor: e.target.value })}
                    />
                    <NumberField
                      compact
                      step="0.01"
                      prefix="$"
                      label={`${t("cost", lang)} — ${p.name}`}
                      placeholder={t("cost", lang)}
                      value={p.cost}
                      onChange={(cost) => patchPlant(p.id, { cost })}
                    />
                  </div>
                </div>
              </RowShell>
            ))}
          </ul>
        )}
        <Button onClick={addPlant} full className="mt-3">
          <IconPlus />
          {t("addPlant", lang)}
        </Button>
      </Accordion>

      {/* ---------------- Subcontractors ---------------- */}
      <Accordion title={t("subcontractors", lang)} count={report.subcontractors.length}>
        {report.subcontractors.length === 0 ? (
          <EmptyNote>{t("nothingHere", lang)}</EmptyNote>
        ) : (
          <ul className="space-y-2">
            {report.subcontractors.map((s) => (
              <RowShell
                key={s.id}
                title={s.tradeLabel[lang]}
                removeLabel={t("remove", lang)}
                onRemove={() =>
                  update({ subcontractors: report.subcontractors.filter((x) => x.id !== s.id) })
                }
              >
                <div className="space-y-2">
                  <select
                    className="field"
                    aria-label={t("trade", lang)}
                    value={s.trade}
                    onChange={(e) => {
                      const found = SUBCONTRACTOR_TRADES.find((tr) => tr.id === e.target.value);
                      if (found) patchSub(s.id, { trade: found.id, tradeLabel: found.label });
                    }}
                  >
                    {SUBCONTRACTOR_TRADES.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.label[lang]}
                      </option>
                    ))}
                  </select>
                  <TextField
                    label={t("vendor", lang)}
                    placeholder={t("vendor", lang)}
                    value={s.vendor}
                    onChange={(vendor) => patchSub(s.id, { vendor })}
                  />
                  <TextField
                    label={t("subDescription", lang)}
                    placeholder={t("subDescription", lang)}
                    value={s.description}
                    onChange={(description) => patchSub(s.id, { description })}
                  />
                </div>
              </RowShell>
            ))}
          </ul>
        )}
        <Button onClick={addSub} full className="mt-3">
          <IconPlus />
          {t("addSub", lang)}
        </Button>
      </Accordion>

      {/* ---------------- Trucks & logistics ---------------- */}
      <Accordion
        title={`${t("trucks", lang)} · ${t("logistics", lang)}`}
        count={report.trucks.length + (report.mileageTrips !== null ? 1 : 0) + (report.disposals ? 1 : 0)}
      >
        <ul className="space-y-2">
          {TRUCKS.map((truck) => {
            const picked = report.trucks.find((tr) => tr.id === truck.id);
            return (
              <li
                key={truck.id}
                className="flex items-center gap-2.5 rounded-xl border border-[color:var(--line)] p-2.5"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={Boolean(picked)}
                  onClick={() => toggleTruck(truck.id)}
                  className="flex min-w-0 flex-1 touch-target items-center gap-2.5 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-[1.5px] transition ${
                      picked
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--line)]"
                    }`}
                  >
                    {picked && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="m5 12.5 4.5 4.5L19 7"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="truncate text-[15px] font-medium">{truck.label[lang]}</span>
                </button>
                {picked && (
                  <div className="w-20 shrink-0">
                    <NumberField
                      compact
                      label={`${t("hrs", lang)} — ${truck.label[lang]}`}
                      placeholder={t("hrs", lang)}
                      value={picked.hours}
                      onChange={(hours) => patchTruck(truck.id, hours)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              step="1"
              label={t("mileageTrips", lang)}
              value={report.mileageTrips}
              onChange={(mileageTrips) => update({ mileageTrips })}
            />
            <TextField
              label={t("mileageWhere", lang)}
              value={report.mileageWhere}
              onChange={(mileageWhere) => update({ mileageWhere })}
            />
          </div>
          <TextField
            label={t("disposals", lang)}
            value={report.disposals}
            onChange={(disposals) => update({ disposals })}
          />
        </div>
      </Accordion>

      {total > 0 && (
        <p className="px-1 text-right text-sm font-semibold">
          {t("materialsTotal", lang)}:{" "}
          <span className="tabular-nums text-[color:var(--accent)]">{formatMoney(total)}</span>
        </p>
      )}
    </div>
  );
}
