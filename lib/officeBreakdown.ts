import type { Dimension, GroupRow, Measure } from "./analytics";
import type { ConsoleKey } from "./i18n";

/**
 * What the advanced screen is asking, as a URL.
 *
 * Same bargain as the period and the search filters: the whole question lives in
 * the query string, so "materials by client, biggest first, for July" is a link
 * somebody sends rather than a sequence of clicks they have to describe.
 *
 * Pure, so the CSV route and the page can both read the same question out of the
 * same request and be guaranteed to answer it identically — an export that did
 * not match the table above it would be worse than no export.
 */

export const DIMENSIONS: Dimension[] = ["week", "day", "client", "foreman"];

/**
 * The columns, in the order they are shown, and the only measures that may be
 * sorted on. A sort key that is not in this list is dropped rather than passed
 * to Convex, which would reject it and turn a stale bookmark into an error page.
 */
export const MEASURES: Measure[] = [
  "reports",
  "crewHours",
  "onSiteHours",
  "travelHours",
  "travelShare",
  "materialsCost",
  "yardCost",
  "boughtCost",
  "ownedHours",
  "rentalHours",
];

export const DEFAULT_DIMENSION: Dimension = "week";

export type Breakdown = {
  by: Dimension;
  /** Null means the dimension's own order — a week reads as a sequence. */
  sort: Measure | null;
};

const PARAM = { by: "by", sort: "sort" } as const;

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseBreakdown(params: Params): Breakdown {
  const by = one(params, PARAM.by);
  const sort = one(params, PARAM.sort);

  return {
    by: DIMENSIONS.includes(by as Dimension) ? (by as Dimension) : DEFAULT_DIMENSION,
    sort: MEASURES.includes(sort as Measure) ? (sort as Measure) : null,
  };
}

/**
 * The breakdown as a query string, on top of whatever the period already wrote.
 *
 * The period comes first because it is the thing that scopes everything else,
 * and a URL somebody reads should say the range before it says the grouping.
 */
export function breakdownQuery(period: string, breakdown: Breakdown, sort?: Measure | null): string {
  const query = new URLSearchParams(period);
  query.set(PARAM.by, breakdown.by);

  const next = sort === undefined ? breakdown.sort : sort;
  if (next) query.set(PARAM.sort, next);
  else query.delete(PARAM.sort);

  return query.toString();
}

/* ------------------------------------------------------------------ */
/* The table, defined once                                             */
/* ------------------------------------------------------------------ */

export const DIMENSION_LABEL: Record<Dimension, ConsoleKey> = {
  week: "groupWeek",
  day: "groupDay",
  client: "groupClient",
  foreman: "groupForeman",
};

export const MEASURE_LABEL: Record<Measure, ConsoleKey> = {
  reports: "colReports",
  crewHours: "colCrewHours",
  onSiteHours: "colOnSite",
  travelHours: "colTravel",
  travelShare: "colShare",
  materialsCost: "colCost",
  yardCost: "seriesYard",
  boughtCost: "seriesBought",
  ownedHours: "seriesOwned",
  rentalHours: "seriesRented",
};

/**
 * How each measure is written down.
 *
 * `plain` is the one the CSV takes: no currency symbol, no thousands separator,
 * no percent sign — a spreadsheet that has to strip "$1,234.56" back into a
 * number before it can add a column is a spreadsheet somebody gives up on. The
 * screen gets the formatted version; the file gets the number.
 */
export type MeasureFormat = "hours" | "money" | "share" | "count";

export const MEASURE_FORMAT: Record<Measure, MeasureFormat> = {
  reports: "count",
  crewHours: "hours",
  onSiteHours: "hours",
  travelHours: "hours",
  travelShare: "share",
  materialsCost: "money",
  yardCost: "money",
  boughtCost: "money",
  ownedHours: "hours",
  rentalHours: "hours",
};

/** The raw value, as a spreadsheet wants it. Null shares stay empty, not zero. */
export function plainValue(row: GroupRow, measure: Measure): string {
  const value = row[measure];
  if (value === null) return "";
  // A share is stored 0–1 and read as a percentage everywhere it is shown, so
  // the file carries the percentage too — the two must not disagree.
  return MEASURE_FORMAT[measure] === "share" ? String(Math.round(value * 100)) : String(value);
}
