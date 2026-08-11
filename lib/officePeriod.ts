import { isoDateOrNull, shiftDate, startOfWeek, todayForOffice } from "./officeDate";

/**
 * What "the period" is, as a URL.
 *
 * The same bargain `lib/officeSearch.ts` makes, for the same reason: the period
 * lives in the query string and nowhere else, so a summary is a link. "The last
 * six weeks, and look at the rentals" is something a project manager pastes into
 * a message rather than a set of buttons they have to describe over the phone.
 *
 * Pure, and tested without a browser or a deployment.
 */

export type PresetId = "week" | "4w" | "6w" | "month";

export type Period = {
  from: string;
  to: string;
  /** Null once the dates stop matching any preset — a hand-picked range. */
  preset: PresetId | null;
};

export const PRESETS: PresetId[] = ["week", "4w", "6w", "month"];

/** The opening question. Six weeks is long enough for a trend and short enough
 *  that every week is still one somebody remembers. */
export const DEFAULT_PRESET: PresetId = "6w";

const PARAM = { from: "from", to: "to", preset: "p" } as const;

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/** The first day of the month a date falls in. */
function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/**
 * A preset as two dates.
 *
 * Every one of them ends today rather than at the end of a calendar unit: the
 * office is asking about work that has happened, and a range running into next
 * Saturday would draw a half-empty final column that reads as a collapse.
 *
 * The week-based ones start on a Monday so the weekly columns are whole weeks.
 * `4w` and `6w` are inclusive of the current, partial week — four weeks means
 * three finished ones and the one in progress, which is what somebody means.
 */
export function presetRange(preset: PresetId, at: Date = new Date()): { from: string; to: string } {
  const to = todayForOffice(at);

  switch (preset) {
    case "week":
      return { from: startOfWeek(to), to };
    case "4w":
      return { from: startOfWeek(shiftDate(to, -21)), to };
    case "month":
      return { from: startOfMonth(to), to };
    case "6w":
    default:
      return { from: startOfWeek(shiftDate(to, -35)), to };
  }
}

/** Which preset a pair of dates happens to be, or null. */
export function presetFor(from: string, to: string, at: Date = new Date()): PresetId | null {
  for (const preset of PRESETS) {
    const range = presetRange(preset, at);
    if (range.from === from && range.to === to) return preset;
  }
  return null;
}

/**
 * The period a URL is asking for.
 *
 * Explicit dates win over a preset, because a link that carries dates was shared
 * to show somebody a *specific* stretch of time — resolving it against today's
 * clock would show the reader a different month than the sender saw. A preset
 * with no dates is the opposite promise and is resolved fresh every time.
 */
export function parsePeriod(params: Params, at: Date = new Date()): Period {
  const from = isoDateOrNull(one(params, PARAM.from));
  const to = isoDateOrNull(one(params, PARAM.to));

  if (from && to) {
    // Swapped rather than rejected: a range that reads right to left returns
    // nothing, which looks exactly like a month the company was closed.
    const range = from <= to ? { from, to } : { from: to, to: from };
    return { ...range, preset: presetFor(range.from, range.to, at) };
  }

  const raw = one(params, PARAM.preset);
  const preset = PRESETS.includes(raw as PresetId) ? (raw as PresetId) : DEFAULT_PRESET;

  // Half a hand-edited URL still asks a sensible question: one date anchors the
  // range rather than being thrown away.
  if (from) return { from, to: todayForOffice(at), preset: null };
  if (to) return { from: startOfWeek(shiftDate(to, -35)), to, preset: null };

  return { ...presetRange(preset, at), preset };
}

/**
 * The period as a query string.
 *
 * A preset is written as a preset, not as the dates it resolved to — that is the
 * difference between "the last six weeks" and "29 June to 10 August", and only
 * one of them still means the same thing when it is opened next month.
 */
export function periodQuery(period: Period): string {
  const query = new URLSearchParams();
  if (period.preset) query.set(PARAM.preset, period.preset);
  else {
    query.set(PARAM.from, period.from);
    query.set(PARAM.to, period.to);
  }
  return query.toString();
}

/** How many days the period covers, both ends included. */
export function lengthInDays(period: { from: string; to: string }): number {
  const from = Date.parse(`${period.from}T12:00:00Z`);
  const to = Date.parse(`${period.to}T12:00:00Z`);
  return Math.round((to - from) / 86_400_000) + 1;
}

/**
 * The stretch of the same length immediately before — what every delta on the
 * screen is measured against.
 *
 * Same length rather than "the previous calendar month", because the period it
 * is compared to is usually not a calendar unit either, and two ranges of
 * different lengths would make every percentage a lie about growth.
 */
export function previousPeriod(period: { from: string; to: string }): { from: string; to: string } {
  const days = lengthInDays(period);
  return { from: shiftDate(period.from, -days), to: shiftDate(period.from, -1) };
}
