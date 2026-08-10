/**
 * What "today" means to the office.
 *
 * Not `new Date().toISOString().slice(0, 10)`, which is UTC: at 8pm in New
 * Jersey that already reads as tomorrow, so a PM opening the console after a
 * long day would be shown an empty board and told nobody filed anything. The
 * reports themselves are stamped with the date the foreman's phone was on, so
 * the console has to ask the same question in the same timezone.
 *
 * One fixed zone rather than the viewer's: the company works in one place, and
 * a manager checking the day from a hotel in another timezone still means his
 * crews' day, not his own.
 */

export const COMPANY_TIMEZONE = "America/New_York";

/** YYYY-MM-DD, which is also lexical order, which is also chronological order. */
export function isoDateIn(timeZone: string, at: Date = new Date()): string {
  // `en-CA` formats as YYYY-MM-DD, which saves reassembling parts by hand.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function todayForOffice(at: Date = new Date()): string {
  return isoDateIn(COMPANY_TIMEZONE, at);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date out of the URL, or today.
 *
 * Anything malformed falls back to today rather than erroring: this value comes
 * off a query string that people paste into WhatsApp, and a mangled link should
 * land on the day board, not on a crash.
 */
export function dateFromParam(raw: string | undefined, at: Date = new Date()): string {
  if (typeof raw !== "string" || !ISO_DATE.test(raw)) return todayForOffice(at);
  // Rejects 2026-13-40, which matches the shape but is not a day.
  const parsed = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return todayForOffice(at);
  if (isoDateIn("UTC", parsed) !== raw) return todayForOffice(at);
  return raw;
}

/** The day before or after, staying on calendar days rather than 24-hour jumps. */
export function shiftDate(isoDate: string, days: number): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return isoDateIn("UTC", at);
}

/** "Friday, 8 August" — the heading a PM reads, not the key the database uses. */
export function longDate(isoDate: string, locale: string): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(at);
}
