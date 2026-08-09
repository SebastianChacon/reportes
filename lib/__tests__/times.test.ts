import { describe, expect, it } from "vitest";
import {
  lunchMinutes,
  nowTimeValue,
  onSiteHours,
  suggestedCrewHours,
  timeErrors,
  totalDayHours,
  travelHours,
  warnings,
} from "../calc";
import { emptyReport, type JobReport } from "../types";

/** A report with just the four checkpoints filled in. */
function day(times: Partial<JobReport>): JobReport {
  return { ...emptyReport("es"), ...times };
}

/** The standard BTN day the foreman described: out at 7, back at 4:30. */
const STANDARD = {
  startYard: "07:00",
  startJob: "07:30",
  endJob: "16:00",
  endYard: "16:30",
};

describe("the day the foreman actually works", () => {
  it("turns 7:00 → 4:30 with a 30 min lunch into 9 hours, not 9.5", () => {
    expect(totalDayHours(day(STANDARD))).toBe(9);
  });

  it("counts lunch against time on site, not against driving", () => {
    const r = day(STANDARD);
    expect(onSiteHours(r)).toBe(8); // 7:30 → 16:00 is 8.5, minus the break
    expect(travelHours(r)).toBe(1); // half an hour out, half an hour back
  });

  it("gives back the half hour when the crew did not stop for lunch", () => {
    expect(totalDayHours(day({ ...STANDARD, lunchMinutes: 0 }))).toBe(9.5);
  });

  it("takes an hour off for an hour lunch", () => {
    expect(totalDayHours(day({ ...STANDARD, lunchMinutes: 60 }))).toBe(8.5);
  });

  it("reports nothing at all until both ends of the day are entered", () => {
    expect(totalDayHours(day({ startYard: "07:00" }))).toBeNull();
    expect(onSiteHours(day({ startJob: "07:30" }))).toBeNull();
    expect(travelHours(day({ startYard: "07:00", endYard: "16:30" }))).toBeNull();
  });

  it("never returns a negative day when the break is longer than the shift", () => {
    const r = day({ startYard: "07:00", endYard: "07:15", lunchMinutes: 60 });
    expect(totalDayHours(r)).toBe(0);
  });
});

describe("times that cannot be right", () => {
  it("accepts a day whose checkpoints run in order", () => {
    expect(timeErrors(day(STANDARD))).toEqual([]);
  });

  it("rejects arriving at the job before leaving the yard", () => {
    const r = day({ ...STANDARD, startJob: "06:30" });
    expect(timeErrors(r)).toEqual([{ field: "startJob", after: "startYard" }]);
  });

  it("rejects leaving the job before arriving at it", () => {
    const r = day({ ...STANDARD, endJob: "07:15" });
    expect(timeErrors(r)).toEqual([{ field: "endJob", after: "startJob" }]);
  });

  it("rejects getting back to the yard before leaving the job", () => {
    const r = day({ ...STANDARD, endYard: "15:00" });
    expect(timeErrors(r)).toEqual([{ field: "endYard", after: "endJob" }]);
  });

  it("catches the AM/PM slip that used to book a 21-hour day", () => {
    // 4:30 AM instead of PM. The old code rolled it past midnight and happily
    // reported 21.5 hours to payroll.
    const r = day({ ...STANDARD, endYard: "04:30" });
    expect(timeErrors(r)).toEqual([{ field: "endYard", after: "endJob" }]);
    expect(totalDayHours(r)).toBeNull();
  });

  it("blames one bad time, not every field after it", () => {
    // Only the job arrival is wrong; the rest of the day still makes sense.
    const r = day({ ...STANDARD, startJob: "05:00" });
    expect(timeErrors(r)).toHaveLength(1);
    expect(timeErrors(r)[0].field).toBe("startJob");
  });

  it("still allows a genuine night shift across midnight", () => {
    const r = day({
      startYard: "22:00",
      startJob: "22:30",
      endJob: "01:00",
      endYard: "01:30",
      lunchMinutes: 0,
    });
    expect(timeErrors(r)).toEqual([]);
    expect(totalDayHours(r)).toBe(3.5);
    expect(onSiteHours(r)).toBe(2.5);
  });

  it("skips over gaps instead of inventing an order", () => {
    // Job times left blank — the yard pair alone is perfectly valid.
    const r = day({ startYard: "07:00", endYard: "16:30" });
    expect(timeErrors(r)).toEqual([]);
    expect(totalDayHours(r)).toBe(9);
  });

  it("checks against the last good checkpoint when one is missing", () => {
    const r = day({ startYard: "07:00", endJob: "06:00" });
    expect(timeErrors(r)).toEqual([{ field: "endJob", after: "startYard" }]);
  });

  it("warns rather than blocks on a long but ordered day", () => {
    // 5 AM to 11 PM is punishing, not impossible — it stays a soft warning.
    const r = day({ startYard: "05:00", endYard: "23:00", lunchMinutes: 0 });
    expect(timeErrors(r)).toEqual([]);
    expect(warnings(r).map((w) => w.key)).toContain("warnLongDay");
  });
});

describe("hours suggested for the crew", () => {
  it("suggests the paid day — 9 for the standard 7:00 → 4:30", () => {
    expect(suggestedCrewHours(day(STANDARD))).toBe(9);
  });

  it("lands on the quarter hour", () => {
    const r = day({ startYard: "07:00", endYard: "15:40", lunchMinutes: 30 });
    // 8.17 hours of paid time rounds to a payroll-friendly 8.25.
    expect(suggestedCrewHours(r)).toBe(8.25);
  });

  it("suggests nothing when the times are missing or contradictory", () => {
    expect(suggestedCrewHours(emptyReport("es"))).toBeNull();
    expect(suggestedCrewHours(day({ ...STANDARD, endYard: "04:30" }))).toBeNull();
  });

  it("suggests nothing for a day that adds up to zero", () => {
    const r = day({ startYard: "07:00", endYard: "07:20", lunchMinutes: 30 });
    expect(suggestedCrewHours(r)).toBeNull();
  });
});

describe("reports queued before lunch existed", () => {
  it("treats a missing break as no break, so old totals do not shift", () => {
    const legacy = { ...day(STANDARD), lunchMinutes: undefined } as unknown as JobReport;
    expect(lunchMinutes(legacy)).toBe(0);
    expect(totalDayHours(legacy)).toBe(9.5);
  });

  it("ignores a nonsense break rather than producing a nonsense day", () => {
    expect(lunchMinutes({ ...day(STANDARD), lunchMinutes: -30 })).toBe(0);
    expect(lunchMinutes({ ...day(STANDARD), lunchMinutes: NaN })).toBe(0);
    expect(lunchMinutes({ ...day(STANDARD), lunchMinutes: 9999 })).toBe(240);
  });

  it("survives time fields that are absent entirely", () => {
    const legacy = { ...emptyReport("en"), startYard: undefined } as unknown as JobReport;
    expect(() => timeErrors(legacy)).not.toThrow();
    expect(timeErrors(legacy)).toEqual([]);
  });
});

describe("the Now button", () => {
  it("snaps down to a five minute mark", () => {
    expect(nowTimeValue(new Date(2026, 7, 8, 7, 3))).toBe("07:00");
    expect(nowTimeValue(new Date(2026, 7, 8, 16, 34))).toBe("16:30");
  });

  it("pads to HH:MM so the time input accepts it", () => {
    expect(nowTimeValue(new Date(2026, 7, 8, 9, 5))).toBe("09:05");
    expect(nowTimeValue(new Date(2026, 7, 8, 0, 0))).toBe("00:00");
  });
});
