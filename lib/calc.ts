import type { JobReport } from "./types";

/** "HH:MM" → minutes since midnight, or null. */
export function toMinutes(hhmm: string): number | null {
  // Reports replayed from an outbox written by an older app version can be
  // missing time fields entirely; an absent time is simply "no time", not a crash.
  if (typeof hhmm !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Difference in hours, rolling past midnight if needed. */
export function hoursBetween(start: string, end: string): number | null {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a === null || b === null) return null;
  const diff = b >= a ? b - a : b + 24 * 60 - a;
  return Math.round((diff / 60) * 100) / 100;
}

export function totalDayHours(r: JobReport): number | null {
  return hoursBetween(r.startYard, r.endYard);
}

export function onSiteHours(r: JobReport): number | null {
  return hoursBetween(r.startJob, r.endJob);
}

export function travelHours(r: JobReport): number | null {
  const total = totalDayHours(r);
  const site = onSiteHours(r);
  if (total === null || site === null) return null;
  return Math.round((total - site) * 100) / 100;
}

export function crewTotalHours(r: JobReport): number {
  return r.crew.reduce((sum, c) => sum + (c.hours ?? 0), 0);
}

export function materialsTotalCost(r: JobReport): number {
  const mats = r.materials.reduce((sum, m) => sum + (m.cost ?? 0), 0);
  const plants = r.plants.reduce((sum, p) => sum + (p.cost ?? 0), 0);
  return Math.round((mats + plants) * 100) / 100;
}

export type Warning = { key: string; field?: string };

/** Soft checks — they inform, they never block sending. */
export function warnings(r: JobReport): Warning[] {
  const out: Warning[] = [];

  const total = totalDayHours(r);
  if (total !== null && total > 16) out.push({ key: "warnLongDay", field: "times" });

  for (const [start, end] of [
    [r.startYard, r.endYard],
    [r.startJob, r.endJob],
  ] as const) {
    const a = toMinutes(start);
    const b = toMinutes(end);
    // A shift that appears to run backwards by more than 12h is a typo, not a night shift.
    if (a !== null && b !== null && b < a && a - b > 12 * 60) {
      out.push({ key: "warnEndBeforeStart", field: "times" });
      break;
    }
  }

  if (r.crew.length === 0) out.push({ key: "warnNoCrew", field: "crew" });
  else if (r.crew.some((c) => c.hours === null || c.hours === 0)) {
    out.push({ key: "warnNoHours", field: "crew" });
  }

  return out;
}

/** Hard requirements — the office cannot file a report without these. */
export function missingRequired(r: JobReport): string[] {
  const missing: string[] = [];
  if (!r.date) missing.push("date");
  if (!r.clientName.trim()) missing.push("clientName");
  if (r.jobNumbers.length === 0) missing.push("jobNumbers");
  if (!r.description.original.trim()) missing.push("description");
  return missing;
}

export function formatHours(n: number | null): string {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
