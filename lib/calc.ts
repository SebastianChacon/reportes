import type { JobReport } from "./types";

const DAY_MINUTES = 24 * 60;

/** Beyond this a "day" is a typo, not a shift. Also the ceiling used to decide
 *  whether an out-of-order time means "after midnight" or "you picked AM". */
export const MAX_DAY_HOURS = 16;

/** The four checkpoints of a work day, in the order they must happen. */
export const TIME_FIELDS = ["startYard", "startJob", "endJob", "endYard"] as const;
export type TimeFieldName = (typeof TIME_FIELDS)[number];

/** Lunch lengths offered in the UI. 30 covers the standard BTN day. */
export const LUNCH_CHOICES = [0, 30, 45, 60] as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

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

/** "HH:MM" for a Date, snapped down to a 5-minute mark. */
export function nowTimeValue(at: Date = new Date()): string {
  const minutes = Math.floor(at.getMinutes() / 5) * 5;
  return `${String(at.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** A time the foreman entered that cannot come where it does. */
export type TimeError = {
  field: TimeFieldName;
  /** The checkpoint it would have to come after — used to word the message. */
  after: TimeFieldName;
};

type Timeline = {
  /** Minutes on one continuous line, so a shift may run past midnight. */
  at: Partial<Record<TimeFieldName, number>>;
  errors: TimeError[];
};

/**
 * Lays the four checkpoints on a single minute line.
 *
 * A time earlier than the one before it is read as "after midnight" — but only
 * while that still describes a believable day. A foreman who picks 4:30 AM for
 * "back at the yard" after leaving at 7:00 AM is not working 21.5 hours, he
 * missed the AM/PM wheel, so that is reported as an error instead of silently
 * turning into a monster day. Genuine night shifts (out 10 PM, back 2 AM) stay
 * valid because they land well under MAX_DAY_HOURS.
 */
function timeline(r: JobReport): Timeline {
  const at: Partial<Record<TimeFieldName, number>> = {};
  const errors: TimeError[] = [];
  let previous: number | null = null;
  let previousField: TimeFieldName | null = null;
  let anchor: number | null = null;

  for (const field of TIME_FIELDS) {
    const raw = toMinutes(r[field]);
    if (raw === null) continue;

    let absolute = raw;
    if (previous !== null && previousField !== null && absolute < previous) {
      while (absolute < previous) absolute += DAY_MINUTES;
      // Rolling over is an inference, so it only stands while the resulting day
      // is believable. A same-day shift that simply runs long is not judged
      // here — that stays a soft warning (see `warnings`).
      if (anchor !== null && absolute - anchor > MAX_DAY_HOURS * 60) {
        errors.push({ field, after: previousField });
        // Keep walking from the last time that made sense, so one bad entry
        // does not cascade into an error on every field after it.
        continue;
      }
    }

    if (anchor === null) anchor = absolute;
    at[field] = absolute;
    previous = absolute;
    previousField = field;
  }

  return { at, errors };
}

/** Times that contradict each other. Unlike `warnings`, these block the report. */
export function timeErrors(r: JobReport): TimeError[] {
  return timeline(r).errors;
}

/** Minutes of unpaid lunch, clamped to something a break can actually be. */
export function lunchMinutes(r: JobReport): number {
  // A report queued before lunch existed has no field at all; it was totalled
  // without a break, and replaying it must not quietly change its hours.
  const raw = r.lunchMinutes;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(raw, 4 * 60);
}

function spanHours(r: JobReport, from: TimeFieldName, to: TimeFieldName): number | null {
  const { at } = timeline(r);
  const a = at[from];
  const b = at[to];
  if (a === undefined || b === undefined) return null;
  return round2((b - a) / 60);
}

/** Yard to yard, minus the unpaid break. This is what the crew gets paid for. */
export function totalDayHours(r: JobReport): number | null {
  const span = spanHours(r, "startYard", "endYard");
  if (span === null) return null;
  return round2(Math.max(0, span - lunchMinutes(r) / 60));
}

/** Time on the job, minus the break — lunch is eaten on site, not in the truck. */
export function onSiteHours(r: JobReport): number | null {
  const span = spanHours(r, "startJob", "endJob");
  if (span === null) return null;
  return round2(Math.max(0, span - lunchMinutes(r) / 60));
}

/** Driving time. Taken from the raw spans so the break cancels out cleanly. */
export function travelHours(r: JobReport): number | null {
  const day = spanHours(r, "startYard", "endYard");
  const site = spanHours(r, "startJob", "endJob");
  if (day === null || site === null) return null;
  return round2(day - site);
}

/**
 * Hours to pre-fill for each crew member: the paid day, on the quarter hour.
 * Only a starting point — anyone who worked different hours gets edited.
 */
export function suggestedCrewHours(r: JobReport): number | null {
  const total = totalDayHours(r);
  if (total === null || total <= 0) return null;
  return Math.round(total * 4) / 4;
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
  if (total !== null && total > MAX_DAY_HOURS) out.push({ key: "warnLongDay", field: "times" });

  // Times that run backwards used to warn here; they are hard errors now
  // (see `timeErrors`), because a wrong AM/PM silently doubles a payroll day.

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
