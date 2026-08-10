/**
 * How the console prints numbers.
 *
 * Formatting only — nothing here adds anything up. Every total the console
 * shows was worked out at write time in `lib/calc.ts` and rolled up in
 * `lib/summaries.ts`; a number formatted here that had been recomputed on the
 * way to the screen could disagree with the PDF the foreman already sent.
 */

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const MONEY_EXACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Rounded, for the four numbers across the top — cents are noise at a glance. */
export function money(n: number): string {
  return MONEY.format(n);
}

/** To the cent, for a line item somebody may have to reconcile against a receipt. */
export function moneyExact(n: number): string {
  return MONEY_EXACT.format(n);
}

/**
 * Hours without trailing zeros: 8, 8.5, 7.25.
 *
 * `null` is not zero and must not print as it — nobody writing the hours down is
 * a different fact from nobody working, and payroll acts on the difference.
 */
export function hours(n: number | null): string | null {
  if (n === null) return null;
  return String(Math.round(n * 100) / 100);
}

/** A 24-hour "07:15" as the office reads it. Empty stays empty. */
export function clockTime(value: string, locale = "en-US"): string {
  if (!/^\d{2}:\d{2}$/.test(value)) return value;
  const [h, m] = value.split(":").map(Number);
  const at = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}

/** "9:12 PM" from the ISO stamp written when the report was filed. */
export function filedAtTime(iso: string, locale = "en-US"): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}
