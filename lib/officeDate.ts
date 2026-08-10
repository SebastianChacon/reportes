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
 * A real calendar day out of a query string, or null.
 *
 * Every date the console reads arrives this way — off a URL that somebody
 * pasted into WhatsApp, retyped by hand, or truncated. Null is the answer for
 * anything that is not a day, and each screen decides for itself what to fall
 * back to, because "today" is right for the day board and wrong for the end of
 * a range.
 */
export function isoDateOrNull(raw: string | undefined | null): string | null {
  if (typeof raw !== "string" || !ISO_DATE.test(raw)) return null;
  // Rejects 2026-13-40, which matches the shape but is not a day.
  const parsed = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (isoDateIn("UTC", parsed) !== raw) return null;
  return raw;
}

/**
 * A date out of the URL, or today.
 *
 * Anything malformed falls back to today rather than erroring: a mangled link
 * should land on the day board, not on a crash.
 */
export function dateFromParam(raw: string | undefined, at: Date = new Date()): string {
  return isoDateOrNull(raw) ?? todayForOffice(at);
}

/** The day before or after, staying on calendar days rather than 24-hour jumps. */
export function shiftDate(isoDate: string, days: number): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return isoDateIn("UTC", at);
}

/**
 * The Monday of the week a date falls in.
 *
 * Monday rather than Sunday because that is the week the work is organised in
 * and the week payroll is counted in — a Saturday call-out belongs with the
 * days before it, not with the Sunday that starts the next one.
 */
export function startOfWeek(isoDate: string): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  // getUTCDay is 0 for Sunday, so Sunday is six days into its week, not zero.
  const sinceMonday = (at.getUTCDay() + 6) % 7;
  return shiftDate(isoDate, -sinceMonday);
}

export function endOfWeek(isoDate: string): string {
  return shiftDate(startOfWeek(isoDate), 6);
}

/**
 * A Monday-to-Sunday range out of `from` and `to`, however mangled they arrive.
 *
 * One date is enough to name a week, which is what makes the URL survive being
 * edited by hand: `?from=2026-08-05` is a Wednesday and answers with the week
 * that holds it. Two dates are honoured as given — a fortnight is a legal
 * question — but swapped if they came in backwards, since a range that reads
 * right to left would otherwise return nothing and look like a week off.
 */
export function weekRange(
  from: string | undefined,
  to: string | undefined,
  at: Date = new Date()
): { from: string; to: string } {
  const start = isoDateOrNull(from);
  const end = isoDateOrNull(to);

  if (start && end) {
    return start <= end ? { from: start, to: end } : { from: end, to: start };
  }

  const anchor = start ?? end ?? todayForOffice(at);
  return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
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

/** "Mon, 4 Aug" — a row inside a week, where the month is already established. */
export function shortDate(isoDate: string, locale: string): string {
  const at = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(at);
}
