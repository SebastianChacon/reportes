import { describe, expect, it } from "vitest";
import {
  DEFAULT_RANGE_DAYS,
  filtersFromForm,
  isNarrowed,
  parseFilters,
  searchRange,
  toQuery,
  toQueryArgs,
  type SearchFilters,
} from "../officeSearch";

/** A Sunday, 16:00 UTC — midday in New Jersey, so no timezone edge in play. */
const NOW = new Date("2026-08-09T16:00:00Z");

const EMPTY: SearchFilters = {
  from: "2026-08-03",
  to: "2026-08-09",
  status: null,
  clientName: "",
  jobNumber: "",
  submittedBy: null,
  personId: null,
};

describe("searchRange", () => {
  it("looks back a week when nothing is asked for", () => {
    expect(searchRange(undefined, undefined, NOW)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
  });

  it("counts the window inclusively, so a week is seven days and not eight", () => {
    const { from, to } = searchRange(undefined, undefined, NOW);
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;
    expect(days).toBe(DEFAULT_RANGE_DAYS);
  });

  it("honours a full range, however long", () => {
    expect(searchRange("2026-01-01", "2026-12-31", NOW)).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  /** Backwards matches nothing, which reads on screen as "no reports". */
  it("swaps a backwards range rather than returning nothing", () => {
    expect(searchRange("2026-08-09", "2026-08-01", NOW)).toEqual({
      from: "2026-08-01",
      to: "2026-08-09",
    });
  });

  it("extends forward from a lone start date", () => {
    expect(searchRange("2026-08-01", undefined, NOW)).toEqual({
      from: "2026-08-01",
      to: "2026-08-07",
    });
  });

  it("extends back from a lone end date", () => {
    expect(searchRange(undefined, "2026-08-07", NOW)).toEqual({
      from: "2026-08-01",
      to: "2026-08-07",
    });
  });

  it("treats a malformed date as absent instead of erroring", () => {
    expect(searchRange("2026-13-40", "2026-08-07", NOW)).toEqual({
      from: "2026-08-01",
      to: "2026-08-07",
    });
  });
});

describe("parseFilters", () => {
  it("reads an empty URL as the default week and nothing else", () => {
    expect(parseFilters({}, NOW)).toEqual(EMPTY);
  });

  it("reads every filter off the query string", () => {
    expect(
      parseFilters(
        {
          from: "2026-07-01",
          to: "2026-07-31",
          status: "approved",
          client: "Rosewood",
          job: "21550",
          filedBy: "user_abc",
          person: "aguilar-miguel",
        },
        NOW
      )
    ).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
      status: "approved",
      clientName: "Rosewood",
      jobNumber: "21550",
      submittedBy: "user_abc",
      personId: "aguilar-miguel",
    });
  });

  /**
   * A stale bookmark from a build that spelled a status differently would
   * otherwise be handed to Convex as an argument it rejects, turning an old
   * link into an error page.
   */
  it("drops a status it does not recognise", () => {
    expect(parseFilters({ status: "pending" }, NOW).status).toBeNull();
  });

  it("treats a box nobody typed in as no filter at all", () => {
    const parsed = parseFilters({ client: "   ", job: "", person: "" }, NOW);
    expect(parsed.clientName).toBe("");
    expect(parsed.jobNumber).toBe("");
    expect(parsed.personId).toBeNull();
  });

  it("trims what somebody pasted with a space on the end", () => {
    expect(parseFilters({ client: "  Rosewood " }, NOW).clientName).toBe("Rosewood");
  });

  it("takes the first of a repeated param rather than joining them", () => {
    expect(parseFilters({ client: ["Rosewood", "Ashby"] }, NOW).clientName).toBe("Rosewood");
  });
});

describe("toQuery", () => {
  it("writes the dates even when they are the default", () => {
    // A link shared today and opened next week must show the same reports.
    expect(toQuery(EMPTY)).toBe("from=2026-08-03&to=2026-08-09");
  });

  it("leaves out the filters nobody set", () => {
    const query = toQuery({ ...EMPTY, clientName: "Rosewood" });
    expect(query).toBe("from=2026-08-03&to=2026-08-09&client=Rosewood");
  });

  it("round-trips back to the same filters", () => {
    const filters: SearchFilters = {
      from: "2026-07-01",
      to: "2026-07-31",
      status: "needs_review",
      clientName: "Rosewood & Sons",
      jobNumber: "21550",
      submittedBy: "user_abc",
      personId: "aguilar-miguel",
    };

    const params = Object.fromEntries(new URLSearchParams(toQuery(filters)));
    expect(parseFilters(params, NOW)).toEqual(filters);
  });

  it("escapes a client name with characters a URL cares about", () => {
    const query = toQuery({ ...EMPTY, clientName: "Rosewood & Sons" });
    expect(query).toContain("client=Rosewood+%26+Sons");
    const params = Object.fromEntries(new URLSearchParams(query));
    expect(parseFilters(params, NOW).clientName).toBe("Rosewood & Sons");
  });
});

describe("filtersFromForm", () => {
  it("reads a submitted form by the same rules as a URL", () => {
    const data = new FormData();
    data.set("from", "2026-07-01");
    data.set("to", "2026-07-31");
    data.set("client", "  Rosewood ");
    data.set("status", "");
    data.set("person", "aguilar-miguel");

    expect(filtersFromForm(data, NOW)).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
      status: null,
      clientName: "Rosewood",
      jobNumber: "",
      submittedBy: null,
      personId: "aguilar-miguel",
    });
  });

  it("falls back to the default week when the date boxes are cleared", () => {
    const data = new FormData();
    data.set("from", "");
    data.set("to", "");
    expect(filtersFromForm(data, NOW)).toEqual(EMPTY);
  });
});

describe("isNarrowed", () => {
  it("does not count the date range, which is always set", () => {
    expect(isNarrowed(EMPTY)).toBe(false);
  });

  it("counts any filter beyond it", () => {
    expect(isNarrowed({ ...EMPTY, status: "approved" })).toBe(true);
    expect(isNarrowed({ ...EMPTY, clientName: "Rosewood" })).toBe(true);
    expect(isNarrowed({ ...EMPTY, personId: "aguilar-miguel" })).toBe(true);
  });
});

describe("toQueryArgs", () => {
  /**
   * `clientName: ""` would ask the query to check that every name contains
   * nothing. Absent means "do not narrow by this"; empty means something else.
   */
  it("omits an empty filter rather than sending it", () => {
    expect(toQueryArgs(EMPTY)).toEqual({ from: "2026-08-03", to: "2026-08-09" });
  });

  it("passes on the ones that are set", () => {
    expect(toQueryArgs({ ...EMPTY, status: "approved", jobNumber: "21550" })).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
      status: "approved",
      jobNumber: "21550",
    });
  });

  /** It is a Convex document id, and this module has no Convex import. */
  it("leaves submittedBy to the caller", () => {
    expect(toQueryArgs({ ...EMPTY, submittedBy: "user_abc" })).not.toHaveProperty("submittedBy");
  });
});
