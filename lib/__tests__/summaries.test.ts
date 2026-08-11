import { describe, expect, it } from "vitest";
import {
  matchesFilter,
  missingForemen,
  rollUpPersonWeek,
  summariseDay,
  type DayReport,
  type Foreman,
} from "../summaries";
import type { CrewDayRow, ReportTotals } from "../submission";

function totals(over: Partial<ReportTotals> = {}): ReportTotals {
  return {
    dayHours: 9,
    onSiteHours: 8,
    travelHours: 1,
    crewHours: 27,
    materialsCost: 100,
    ...over,
  };
}

function dayReport(over: Partial<DayReport> = {}): DayReport {
  return {
    totals: totals(),
    crew: [{ personId: "aguilar-miguel", name: "Aguilar, Miguel" }],
    ...over,
  };
}

function crewDay(over: Partial<CrewDayRow> = {}): CrewDayRow {
  return {
    personId: "santander-carlos",
    name: "Santander, Carlos",
    roles: ["F"],
    hours: 8,
    adhoc: false,
    date: "2026-08-03",
    clientName: "Salazar",
    jobNumber: "21550",
    ...over,
  };
}

describe("summariseDay", () => {
  it("gives the office four zeros rather than nothing on a day with no reports", () => {
    expect(summariseDay([])).toEqual({
      reports: 0,
      people: 0,
      crewHours: 0,
      materialsCost: 0,
    });
  });

  it("adds up the totals the phone already computed, without recomputing them", () => {
    const summary = summariseDay([
      dayReport({ totals: totals({ crewHours: 27, materialsCost: 100 }) }),
      dayReport({ totals: totals({ crewHours: 16.5, materialsCost: 42.5 }) }),
    ]);

    expect(summary.reports).toBe(2);
    expect(summary.crewHours).toBe(43.5);
    expect(summary.materialsCost).toBe(142.5);
  });

  it("keeps money to the cent when the floats would drift", () => {
    const summary = summariseDay([
      dayReport({ totals: totals({ materialsCost: 0.1, crewHours: 0.1 }) }),
      dayReport({ totals: totals({ materialsCost: 0.2, crewHours: 0.2 }) }),
    ]);

    expect(summary.materialsCost).toBe(0.3);
    expect(summary.crewHours).toBe(0.3);
  });

  it("counts a man on two crews once", () => {
    const summary = summariseDay([
      dayReport({
        crew: [
          { personId: "aguilar-miguel", name: "Aguilar, Miguel" },
          { personId: "sumba-flavio", name: "Sumba, Flavio" },
        ],
      }),
      dayReport({ crew: [{ personId: "aguilar-miguel", name: "Aguilar, Miguel" }] }),
    ]);

    expect(summary.people).toBe(2);
  });

  it("collapses a written-in name across reports rather than counting him twice", () => {
    const summary = summariseDay([
      dayReport({ crew: [{ personId: null, name: "Juan" }] }),
      dayReport({ crew: [{ personId: null, name: " juan " }] }),
    ]);

    expect(summary.people).toBe(1);
  });
});

describe("missingForemen", () => {
  const miguel: Foreman = { userId: "u1", name: "Aguilar, Miguel", crewMemberId: "aguilar-miguel" };
  const carlos: Foreman = {
    userId: "u2",
    name: "Santander, Carlos",
    crewMemberId: "santander-carlos",
  };
  const flavio: Foreman = { userId: "u3", name: "Sumba, Flavio", crewMemberId: "sumba-flavio" };

  it("names everyone enrolled when nobody has filed yet", () => {
    expect(missingForemen([miguel, carlos], [])).toEqual([miguel, carlos]);
  });

  it("drops the ones who filed", () => {
    expect(missingForemen([miguel, carlos, flavio], ["u2"])).toEqual([miguel, flavio]);
  });

  it("is empty once everyone has sent one — the answer the office wants at 5pm", () => {
    expect(missingForemen([miguel, carlos], ["u1", "u2"])).toEqual([]);
  });

  it("sorts by name, because the office reads it as a list of people", () => {
    expect(missingForemen([flavio, miguel, carlos], []).map((f) => f.name)).toEqual([
      "Aguilar, Miguel",
      "Santander, Carlos",
      "Sumba, Flavio",
    ]);
  });

  it("ignores a filer who is not on the enrolled list", () => {
    expect(missingForemen([miguel], ["someone-else"])).toEqual([miguel]);
  });
});

describe("rollUpPersonWeek", () => {
  it("returns an empty week rather than throwing when the person worked none of it", () => {
    expect(rollUpPersonWeek([])).toEqual({
      days: [],
      totalHours: 0,
      daysWorked: 0,
      daysMissingHours: 0,
    });
  });

  it("puts the days in order even when the rows arrive out of order", () => {
    const week = rollUpPersonWeek([
      crewDay({ date: "2026-08-05" }),
      crewDay({ date: "2026-08-03" }),
      crewDay({ date: "2026-08-04" }),
    ]);

    expect(week.days.map((d) => d.date)).toEqual(["2026-08-03", "2026-08-04", "2026-08-05"]);
  });

  it("adds up two jobs in one day into that day", () => {
    const week = rollUpPersonWeek([
      crewDay({ date: "2026-08-03", clientName: "Salazar", hours: 4 }),
      crewDay({ date: "2026-08-03", clientName: "Weiss", hours: 4.5 }),
    ]);

    expect(week.days).toHaveLength(1);
    expect(week.days[0].hours).toBe(8.5);
    expect(week.days[0].entries).toHaveLength(2);
    expect(week.totalHours).toBe(8.5);
    expect(week.daysWorked).toBe(1);
  });

  it("leaves a day with no hours written down as unknown, not as zero", () => {
    const week = rollUpPersonWeek([crewDay({ date: "2026-08-03", hours: null })]);

    expect(week.days[0].hours).toBeNull();
    expect(week.daysWorked).toBe(1);
    expect(week.daysMissingHours).toBe(1);
  });

  it("counts the day when one of its jobs recorded hours and the other did not", () => {
    const week = rollUpPersonWeek([
      crewDay({ date: "2026-08-03", hours: 6 }),
      crewDay({ date: "2026-08-03", hours: null }),
    ]);

    expect(week.days[0].hours).toBe(6);
    expect(week.daysMissingHours).toBe(0);
  });

  it("totals the week without letting a blank day drag it to zero", () => {
    const week = rollUpPersonWeek([
      crewDay({ date: "2026-08-03", hours: 8 }),
      crewDay({ date: "2026-08-04", hours: null }),
      crewDay({ date: "2026-08-05", hours: 7.5 }),
    ]);

    expect(week.totalHours).toBe(15.5);
    expect(week.daysWorked).toBe(3);
    expect(week.daysMissingHours).toBe(1);
  });
});

describe("matchesFilter", () => {
  const report = {
    clientName: "Salazar Residence",
    jobNumbers: ["21550", "21551"],
    submittedBy: "u1",
  };

  it("keeps everything when nothing was asked for", () => {
    expect(matchesFilter(report, {})).toBe(true);
  });

  it("matches a client on part of the name, in any case", () => {
    expect(matchesFilter(report, { clientName: "salazar" })).toBe(true);
    expect(matchesFilter(report, { clientName: "SALA" })).toBe(true);
    expect(matchesFilter(report, { clientName: "Weiss" })).toBe(false);
  });

  it("matches a job number exactly, against any job on the report", () => {
    expect(matchesFilter(report, { jobNumber: "21551" })).toBe(true);
    // A job number is an identifier — "2155" is a different job, not a prefix.
    expect(matchesFilter(report, { jobNumber: "2155" })).toBe(false);
  });

  it("ignores whitespace around what was typed", () => {
    expect(matchesFilter(report, { jobNumber: " 21550 " })).toBe(true);
    expect(matchesFilter(report, { clientName: "  salazar  " })).toBe(true);
  });

  it("narrows to one foreman", () => {
    expect(matchesFilter(report, { submittedBy: "u1" })).toBe(true);
    expect(matchesFilter(report, { submittedBy: "u2" })).toBe(false);
  });

  it("never matches an unattributed report when a foreman was asked for", () => {
    expect(matchesFilter({ ...report, submittedBy: undefined }, { submittedBy: "u1" })).toBe(false);
  });

  it("requires every filter given to hold, not any of them", () => {
    expect(matchesFilter(report, { clientName: "salazar", jobNumber: "99999" })).toBe(false);
  });

  /**
   * The filter that turns the summary's "Outstanding" counts into links. It has
   * to agree with `outstanding()` above it in this file — a count that says
   * twelve and a search that returns nine is worse than no link at all.
   */
  describe("issue", () => {
    const flagged = { ...report, flags: [{ key: "warnNoHours" }, { key: "warnLongDay" }] };

    it("keeps a report carrying the flag asked for", () => {
      expect(matchesFilter(flagged, { issue: "noHours" })).toBe(true);
      expect(matchesFilter(flagged, { issue: "longDay" })).toBe(true);
    });

    it("drops a report that does not carry it", () => {
      expect(matchesFilter(flagged, { issue: "noCrew" })).toBe(false);
      expect(matchesFilter(report, { issue: "noHours" })).toBe(false);
    });

    it("treats a report with no flags at all as carrying none", () => {
      expect(matchesFilter({ ...report, flags: [] }, { issue: "noHours" })).toBe(false);
    });

    it("reads 'no foreman' as an absent field rather than a flag", () => {
      const orphan = { ...report, submittedBy: undefined, flags: [] };
      expect(matchesFilter(orphan, { issue: "unattributed" })).toBe(true);
      // A report that has a foreman is not unattributed, whatever else is
      // wrong with it.
      expect(matchesFilter(flagged, { issue: "unattributed" })).toBe(false);
    });

    it("still applies alongside the other filters", () => {
      expect(matchesFilter(flagged, { issue: "noHours", clientName: "salazar" })).toBe(true);
      expect(matchesFilter(flagged, { issue: "noHours", clientName: "weiss" })).toBe(false);
    });
  });
});
