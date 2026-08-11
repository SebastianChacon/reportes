import { describe, expect, it } from "vitest";
import {
  lengthInDays,
  parsePeriod,
  periodQuery,
  presetFor,
  presetRange,
  previousPeriod,
} from "../officePeriod";

// A Monday, so a week-based preset has an unambiguous answer.
const MONDAY = new Date("2026-08-10T15:00:00Z");

describe("presetRange", () => {
  it("starts every week-based preset on a Monday", () => {
    expect(presetRange("week", MONDAY)).toEqual({ from: "2026-08-10", to: "2026-08-10" });
    expect(presetRange("4w", MONDAY)).toEqual({ from: "2026-07-20", to: "2026-08-10" });
    expect(presetRange("6w", MONDAY)).toEqual({ from: "2026-07-06", to: "2026-08-10" });
  });

  it("ends today rather than at the end of the unit", () => {
    // A range running into next Saturday would draw a half-empty final column
    // that reads as the company shutting down.
    expect(presetRange("month", MONDAY).to).toBe("2026-08-10");
    expect(presetRange("month", MONDAY).from).toBe("2026-08-01");
  });
});

describe("parsePeriod", () => {
  it("opens on six weeks when the URL says nothing", () => {
    expect(parsePeriod({}, MONDAY)).toEqual({
      from: "2026-07-06",
      to: "2026-08-10",
      preset: "6w",
    });
  });

  it("lets explicit dates beat a preset, so a shared link keeps its month", () => {
    const period = parsePeriod({ p: "week", from: "2026-07-01", to: "2026-07-31" }, MONDAY);
    expect(period).toEqual({ from: "2026-07-01", to: "2026-07-31", preset: null });
  });

  it("recognises a hand-typed range that happens to be a preset", () => {
    const period = parsePeriod({ from: "2026-07-06", to: "2026-08-10" }, MONDAY);
    expect(period.preset).toBe("6w");
  });

  it("swaps a range that arrived backwards instead of returning nothing", () => {
    const period = parsePeriod({ from: "2026-08-01", to: "2026-07-01" }, MONDAY);
    expect(period.from).toBe("2026-07-01");
    expect(period.to).toBe("2026-08-01");
  });

  it("anchors on half a hand-edited URL rather than discarding it", () => {
    expect(parsePeriod({ from: "2026-07-15" }, MONDAY)).toEqual({
      from: "2026-07-15",
      to: "2026-08-10",
      preset: null,
    });
  });

  it("falls back to the default when the preset is not one we have", () => {
    expect(parsePeriod({ p: "decade" }, MONDAY).preset).toBe("6w");
  });
});

describe("periodQuery", () => {
  it("writes a preset as a preset, so the link still means 'the last six weeks'", () => {
    expect(periodQuery({ from: "2026-06-29", to: "2026-08-10", preset: "6w" })).toBe("p=6w");
  });

  it("writes a hand-picked range as dates", () => {
    expect(periodQuery({ from: "2026-07-01", to: "2026-07-31", preset: null })).toBe(
      "from=2026-07-01&to=2026-07-31"
    );
  });
});

describe("previousPeriod", () => {
  it("takes the same number of days immediately before", () => {
    const before = previousPeriod({ from: "2026-08-03", to: "2026-08-09" });
    expect(before).toEqual({ from: "2026-07-27", to: "2026-08-02" });
    expect(lengthInDays(before)).toBe(7);
  });

  it("never overlaps the period it is compared against", () => {
    const period = { from: "2026-07-06", to: "2026-08-10" };
    expect(previousPeriod(period).to < period.from).toBe(true);
  });
});

describe("presetFor", () => {
  it("returns null for a range nobody could have clicked", () => {
    expect(presetFor("2026-07-02", "2026-07-19", MONDAY)).toBeNull();
  });
});
