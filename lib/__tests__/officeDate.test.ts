import { describe, expect, it } from "vitest";
import {
  COMPANY_TIMEZONE,
  dateFromParam,
  isoDateIn,
  longDate,
  shiftDate,
  todayForOffice,
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
