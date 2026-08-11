import { isoDateOrNull, shiftDate, todayForOffice } from "./officeDate";
import { SEARCH_ISSUES, type SearchIssue } from "./summaries";

export type { SearchIssue };

/**
 * What a search is, as a URL.
 *
 * The filters live in the query string and nowhere else. That is not a
 * preference about state management — it is what makes a search something a
 * project manager can send to somebody: "every report Miguel filed last week"
 * is a link they paste into a message, not a set of boxes the other person has
 * to be told how to tick.
 *
 * Everything here is pure. Parsing a URL and printing one back are the two
 * halves of the same rule, and getting them to agree is exactly the kind of
 * thing that should be tested without a browser or a deployment.
 */

export type SearchStatus = "submitted" | "needs_review" | "approved";

const STATUSES: SearchStatus[] = ["submitted", "needs_review", "approved"];

export type SearchFilters = {
  from: string;
  to: string;
  status: SearchStatus | null;
  /** Substring, case-insensitive — nobody types a client's name the same way twice. */
  clientName: string;
  /** Exact: a job number is an identifier, and "2155" is not a prefix of "21550". */
  jobNumber: string;
  /** A `users` id — who filed the report. */
  submittedBy: string | null;
  /** A roster id — who was on the crew, which is a different question. */
  personId: string | null;
  /** One thing wrong with the report, so the summary's counts can be links. */
  issue: SearchIssue | null;
};

/**
 * How far back an unfiltered search looks.
 *
 * A week, because the range is the only thing keeping this bounded and an
 * opening screen has no idea yet what is being looked for. Long enough that
 * "the report I saw on Tuesday" is already on screen; short enough that the
 * first thing a PM sees is not two hundred rows.
 */
export const DEFAULT_RANGE_DAYS = 7;

/** What the URL calls each filter. Short, because these get read by humans. */
const PARAM = {
  from: "from",
  to: "to",
  status: "status",
  clientName: "client",
  jobNumber: "job",
  submittedBy: "filedBy",
  personId: "person",
  issue: "issue",
} as const;

type Params = Record<string, string | string[] | undefined>;

/** A repeated param (`?client=a&client=b`) is a hand-edited URL. Take the first. */
function one(params: Params, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function text(params: Params, key: string): string {
  return (one(params, key) ?? "").trim();
}

/** An empty string is not a filter — it is a box nobody typed in. */
function optional(params: Params, key: string): string | null {
  const value = text(params, key);
  return value.length > 0 ? value : null;
}

/**
 * The date range a search runs over.
 *
 * Both dates given are honoured, swapped if they arrived backwards — a range
 * that reads right to left returns nothing, which looks identical to a quiet
 * fortnight. One date given anchors the default window rather than being
 * discarded, so half a hand-edited URL still asks a sensible question.
 */
export function searchRange(
  from: string | undefined,
  to: string | undefined,
  at: Date = new Date()
): { from: string; to: string } {
  const start = isoDateOrNull(from);
  const end = isoDateOrNull(to);

  if (start && end) return start <= end ? { from: start, to: end } : { from: end, to: start };
  if (start) return { from: start, to: shiftDate(start, DEFAULT_RANGE_DAYS - 1) };
  if (end) return { from: shiftDate(end, -(DEFAULT_RANGE_DAYS - 1)), to: end };

  const today = todayForOffice(at);
  return { from: shiftDate(today, -(DEFAULT_RANGE_DAYS - 1)), to: today };
}

export function parseFilters(params: Params, at: Date = new Date()): SearchFilters {
  const range = searchRange(one(params, PARAM.from), one(params, PARAM.to), at);
  const status = text(params, PARAM.status);
  const issue = text(params, PARAM.issue);

  return {
    ...range,
    // Dropped rather than passed on if unknown, for the same reason status is:
    // a stale bookmark should show a wider search, not an error page.
    issue: SEARCH_ISSUES.includes(issue as SearchIssue) ? (issue as SearchIssue) : null,
    // An unknown status is dropped rather than passed to Convex, which would
    // reject it as an argument and turn a stale bookmark into an error page.
    status: STATUSES.includes(status as SearchStatus) ? (status as SearchStatus) : null,
    clientName: text(params, PARAM.clientName),
    jobNumber: text(params, PARAM.jobNumber),
    submittedBy: optional(params, PARAM.submittedBy),
    personId: optional(params, PARAM.personId),
  };
}

/**
 * The filters as a query string, with the empty ones left out.
 *
 * Dates are always written even when they are the default: a link is shared and
 * then opened next week, and a range that silently moved with the calendar
 * would show the reader a different set of reports than the sender saw.
 */
export function toQuery(filters: SearchFilters): string {
  const query = new URLSearchParams();
  query.set(PARAM.from, filters.from);
  query.set(PARAM.to, filters.to);
  if (filters.status) query.set(PARAM.status, filters.status);
  if (filters.clientName) query.set(PARAM.clientName, filters.clientName);
  if (filters.jobNumber) query.set(PARAM.jobNumber, filters.jobNumber);
  if (filters.submittedBy) query.set(PARAM.submittedBy, filters.submittedBy);
  if (filters.personId) query.set(PARAM.personId, filters.personId);
  if (filters.issue) query.set(PARAM.issue, filters.issue);
  return query.toString();
}

/**
 * The filters as a submitted form, ready to be turned back into a URL.
 *
 * The form is uncontrolled — this reads it once on submit instead of holding
 * every keystroke in React state — so this is where its raw strings become the
 * same shape a URL parses into, and by the same rules.
 */
export function filtersFromForm(data: FormData, at: Date = new Date()): SearchFilters {
  const params: Params = {};
  for (const key of Object.values(PARAM)) {
    const value = data.get(key);
    if (typeof value === "string") params[key] = value;
  }
  return parseFilters(params, at);
}

/** Whether anything beyond the date range is set — the range alone is not a search. */
export function isNarrowed(filters: SearchFilters): boolean {
  return Boolean(
    filters.status ||
      filters.clientName ||
      filters.jobNumber ||
      filters.submittedBy ||
      filters.personId ||
      filters.issue
  );
}

/**
 * The arguments `office.search` takes, from the filters a screen holds.
 *
 * Empty strings are dropped rather than sent: the query treats an absent filter
 * as "do not narrow by this", and `clientName: ""` would ask it to check that
 * every client name contains nothing.
 *
 * `submittedBy` is deliberately not here. It is a Convex document id, and this
 * file has no Convex import for the same reason `lib/summaries.ts` does not —
 * the page adds it where that type is in scope.
 */
export function toQueryArgs(filters: SearchFilters): {
  from: string;
  to: string;
  status?: SearchStatus;
  clientName?: string;
  jobNumber?: string;
  personId?: string;
  issue?: SearchIssue;
} {
  return {
    from: filters.from,
    to: filters.to,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.clientName ? { clientName: filters.clientName } : {}),
    ...(filters.jobNumber ? { jobNumber: filters.jobNumber } : {}),
    ...(filters.personId ? { personId: filters.personId } : {}),
    ...(filters.issue ? { issue: filters.issue } : {}),
  };
}
