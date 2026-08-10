import { describe, expect, it } from "vitest";
import {
  COMPANY_TIMEZONE,
  dateFromParam,
  endOfWeek,
  isoDateIn,
  isoDateOrNull,
  longDate,
  shiftDate,
  shortDate,
  startOfWeek,
  todayForOffice,
  weekRange,
} from "../officeDate";

describe("todayForOffice", () => {
  /**
   * The bug this exists to prevent: a PM opens the console after a long day and
   * is told nobody filed anything, because the server asked UTC what day it was.
   */
  it("is still today at 8pm in New Jersey, when UTC has moved on", () => {
    // 2026-08-09 20:30 EDT is 2026-08-10 00:30 UTC.
    const evening = new Date("2026-08-10T00:30:00Z");

    expect(isoDateIn("UTC", evening)).toBe("2026-08-10");
    expect(todayForOffice(evening)).toBe("2026-08-09");
  });

  it("has already rolled over just after midnight locally", () => {
    // 2026-08-10 00:15 EDT is 2026-08-10 04:15 UTC.
    expect(todayForOffice(new Date("2026-08-10T04:15:00Z"))).toBe("2026-08-10");
  });

  it("reads the same day either side of noon", () => {
    expect(todayForOffice(new Date("2026-08-09T14:00:00Z"))).toBe("2026-08-09");
    expect(todayForOffice(new Date("2026-08-09T22:00:00Z"))).toBe("2026-08-09");
  });

  it("uses one fixed zone, not whatever the reader is in", () => {
    expect(COMPANY_TIMEZONE).toBe("America/New_York");
  });
});

describe("dateFromParam", () => {
  const now = new Date("2026-08-09T16:00:00Z");

  it("takes a well-formed date from the URL", () => {
    expect(dateFromParam("2026-03-14", now)).toBe("2026-03-14");
  });

  /**
   * These links get pasted into WhatsApp and come back mangled. Every bad shape
   * lands on today rather than throwing — a broken link should show the day
   * board, not a crash.
   */
  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["not a date", "yesterday"],
    ["wrong separator", "2026/03/14"],
    ["no padding", "2026-3-4"],
    ["a timestamp", "2026-03-14T10:00:00Z"],
  ])("falls back to today for %s", (_label, raw) => {
    expect(dateFromParam(raw as string | undefined, now)).toBe("2026-08-09");
  });

  it("rejects a date that has the right shape but is not a day", () => {
    expect(dateFromParam("2026-13-40", now)).toBe("2026-08-09");
    expect(dateFromParam("2026-02-30", now)).toBe("2026-08-09");
  });

  it("accepts the leap day in a leap year and refuses it otherwise", () => {
    expect(dateFromParam("2028-02-29", now)).toBe("2028-02-29");
    expect(dateFromParam("2027-02-29", now)).toBe("2026-08-09");
  });
});

describe("shiftDate", () => {
  it("steps one calendar day at a time", () => {
    expect(shiftDate("2026-08-09", -1)).toBe("2026-08-08");
    expect(shiftDate("2026-08-09", 1)).toBe("2026-08-10");
  });

  it("crosses a month and a year boundary", () => {
    expect(shiftDate("2026-08-01", -1)).toBe("2026-07-31");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  /**
   * Anchored at midday UTC on purpose. A date-only value stepped from midnight
   * lands back on the previous day the moment a DST change shortens the night.
   */
  it("does not slip a day across the spring DST change", () => {
    expect(shiftDate("2026-03-08", -1)).toBe("2026-03-07");
    expect(shiftDate("2026-03-07", 1)).toBe("2026-03-08");
  });

  it("does not slip a day across the autumn DST change", () => {
    expect(shiftDate("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDate("2026-11-01", 1)).toBe("2026-11-02");
  });
});

describe("isoDateOrNull", () => {
  it("hands back a real day untouched", () => {
    expect(isoDateOrNull("2026-08-09")).toBe("2026-08-09");
  });

  it("answers null rather than guessing, so each screen picks its own fallback", () => {
    expect(isoDateOrNull(undefined)).toBeNull();
    expect(isoDateOrNull("")).toBeNull();
    expect(isoDateOrNull("2026-02-30")).toBeNull();
  });
});

describe("startOfWeek / endOfWeek", () => {
  /** 2026-08-09 is a Sunday, which is the case a Sunday-start week gets wrong. */
  it("puts Sunday at the end of its week, not the start of the next one", () => {
    expect(startOfWeek("2026-08-09")).toBe("2026-08-03");
    expect(endOfWeek("2026-08-09")).toBe("2026-08-09");
  });

  it("leaves a Monday where it is", () => {
    expect(startOfWeek("2026-08-03")).toBe("2026-08-03");
    expect(endOfWeek("2026-08-03")).toBe("2026-08-09");
  });

  it("holds together mid-week and across a month boundary", () => {
    expect(startOfWeek("2026-08-06")).toBe("2026-08-03");
    expect(startOfWeek("2026-09-01")).toBe("2026-08-31");
    expect(endOfWeek("2026-08-31")).toBe("2026-09-06");
  });

  it("is always seven days long, DST week included", () => {
    // The week of the spring change: 23 hours in it, still seven days.
    expect(startOfWeek("2026-03-08")).toBe("2026-03-02");
    expect(endOfWeek("2026-03-08")).toBe("2026-03-08");
  });
});

describe("weekRange", () => {
  const sunday = new Date("2026-08-09T16:00:00Z");

  it("defaults to the week holding today", () => {
    expect(weekRange(undefined, undefined, sunday)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
  });

  it("honours two dates as given, even when they are not a week", () => {
    expect(weekRange("2026-07-01", "2026-07-31", sunday)).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  /**
   * A backwards range matches nothing, which on screen is indistinguishable
   * from a week the man did not work. Swapping is the only reading that can be
   * right.
   */
  it("swaps a range that arrived backwards", () => {
    expect(weekRange("2026-07-31", "2026-07-01", sunday)).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("takes one date as naming a week, so half a hand-edited URL still works", () => {
    expect(weekRange("2026-08-05", undefined, sunday)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
    expect(weekRange(undefined, "2026-08-05", sunday)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
  });

  it("ignores a malformed date instead of erroring on it", () => {
    expect(weekRange("nonsense", "2026-08-05", sunday)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
    expect(weekRange("nonsense", "rubbish", sunday)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
  });
});

describe("shortDate", () => {
  it("names the weekday and the day, for a row inside a week", () => {
    expect(shortDate("2026-08-03", "en-US")).toBe("Mon, Aug 3");
  });

  it("names the day that was asked for, not the one before it", () => {
    expect(shortDate("2026-01-01", "en-US")).toBe("Thu, Jan 1");
  });
});

describe("longDate", () => {
  it("reads as a day, not as a key", () => {
    expect(longDate("2026-08-09", "en-US")).toBe("Sunday, August 9");
  });

  it("is written in the console's language when that changes", () => {
    expect(longDate("2026-08-09", "es-US")).toContain("agosto");
  });

  /** The date is a plain YYYY-MM-DD and must not be nudged by a timezone. */
  it("names the day that was asked for, not the one before it", () => {
    expect(longDate("2026-01-01", "en-US")).toBe("Thursday, January 1");
  });
});
