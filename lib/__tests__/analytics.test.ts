import { describe, expect, it } from "vitest";
import {
  byClient,
  byWeek,
  calendar,
  delta,
  equipmentSplit,
  groupBy,
  materialSplit,
  outstanding,
  payroll,
  rangeTotals,
  sortRows,
  type AnalyticsReport,
  type PayrollRow,
} from "../analytics";
import type { ReportTotals } from "../submission";

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

function report(over: Partial<AnalyticsReport> = {}): AnalyticsReport {
  return {
    date: "2026-08-03",
    clientName: "Weinstein Residence",
    jobNumbers: ["2155"],
    status: "submitted",
    flags: [],
    submittedBy: "user-1",
    totals: totals(),
    crew: [{ personId: "aguilar-miguel", name: "Aguilar, Miguel", hours: 9 }],
    equipment: [],
    materials: [],
    plants: [],
    ...over,
  };
}

const LABEL = { en: "Skid Steer", es: "Minicargadora" };

describe("rangeTotals", () => {
  it("gives a range with no reports zeros rather than nothing", () => {
    const empty = rangeTotals([]);
    expect(empty.reports).toBe(0);
    expect(empty.crewHours).toBe(0);
    // Not 0 — a share of nothing is not zero percent, it is unanswerable.
    expect(empty.travelShare).toBeNull();
  });

  it("counts a person once however many crews they were on", () => {
    const totalsFor = rangeTotals([
      report({ crew: [{ personId: "santander-carlos", name: "Santander, Carlos", hours: 8 }] }),
      report({ crew: [{ personId: "santander-carlos", name: "Santander, Carlos", hours: 4 }] }),
    ]);
    expect(totalsFor.people).toBe(1);
  });

  it("keeps person-hours and day hours in separate units", () => {
    // Two reports, four people each, nine-hour days: 54 person-hours of labour
    // but only 18 hours of day. Adding them would be meaningless.
    const summed = rangeTotals([
      report({ totals: totals({ crewHours: 27, onSiteHours: 8, travelHours: 1 }) }),
      report({ totals: totals({ crewHours: 27, onSiteHours: 8, travelHours: 1 }) }),
    ]);
    expect(summed.crewHours).toBe(54);
    expect(summed.onSiteHours).toBe(16);
    expect(summed.travelHours).toBe(2);
  });

  it("leaves a half-timed report out of the travel share entirely", () => {
    // A report with on-site hours and no travel hours is a report where the
    // foreman skipped a time box, not a crew that teleported to the job.
    const summed = rangeTotals([
      report({ totals: totals({ onSiteHours: 8, travelHours: 2 }) }),
      report({ totals: totals({ onSiteHours: 8, travelHours: null }) }),
    ]);
    expect(summed.onSiteHours).toBe(8);
    expect(summed.travelHours).toBe(2);
    expect(summed.travelShare).toBeCloseTo(0.2);
  });

  it("splits equipment hours by who owns the machine", () => {
    const summed = rangeTotals([
      report({
        equipment: [
          { id: "skid-steer", label: LABEL, owner: "BTN", hours: 6 },
          { id: "big-excavator", label: LABEL, owner: "RENTAL", hours: 8 },
          { id: "loader", label: LABEL, owner: "RENTAL", hours: null },
        ],
      }),
    ]);
    expect(summed.ownedHours).toBe(6);
    expect(summed.rentalHours).toBe(8);
  });

  it("splits material cost by the yard against the invoice, plants always bought", () => {
    const summed = rangeTotals([
      report({
        materials: [
          { id: "mulch", label: LABEL, source: "BTN", cost: 120 },
          { id: "bluestone", label: LABEL, source: "OTHER", cost: 400 },
        ],
        plants: [{ cost: 80 }],
      }),
    ]);
    expect(summed.yardCost).toBe(120);
    expect(summed.boughtCost).toBe(480);
  });
});

describe("byWeek", () => {
  it("keeps a week nobody worked as an empty bucket", () => {
    const weeks = byWeek([report({ date: "2026-08-03" })], "2026-07-27", "2026-08-08");
    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-07-27", "2026-08-03"]);
    expect(weeks[0].reports).toBe(0);
    expect(weeks[1].reports).toBe(1);
  });

  it("puts a Saturday in the week that started on Monday", () => {
    const weeks = byWeek([report({ date: "2026-08-08" })], "2026-08-03", "2026-08-08");
    expect(weeks).toHaveLength(1);
    expect(weeks[0].weekStart).toBe("2026-08-03");
    expect(weeks[0].reports).toBe(1);
  });

  it("ignores a report that falls outside the range it was asked about", () => {
    const weeks = byWeek([report({ date: "2026-06-01" })], "2026-08-03", "2026-08-08");
    expect(weeks[0].reports).toBe(0);
  });
});

describe("equipmentSplit / materialSplit", () => {
  it("ranks equipment by total hours and keeps the owner split", () => {
    const split = equipmentSplit([
      report({
        equipment: [
          { id: "skid-steer", label: LABEL, owner: "BTN", hours: 4 },
          { id: "big-excavator", label: LABEL, owner: "RENTAL", hours: 9 },
        ],
      }),
      report({
        equipment: [{ id: "skid-steer", label: LABEL, owner: "BTN", hours: 3 }],
      }),
    ]);

    expect(split[0]).toMatchObject({ id: "big-excavator", ours: 0, theirs: 9 });
    expect(split[1]).toMatchObject({ id: "skid-steer", ours: 7, theirs: 0 });
  });

  it("drops an item that was recorded with no quantity at all", () => {
    const split = materialSplit([
      report({ materials: [{ id: "mulch", label: LABEL, source: "BTN", cost: null }] }),
    ]);
    expect(split).toEqual([]);
  });

  it("keeps one machine that was both owned and rented in the range on one row", () => {
    const split = equipmentSplit([
      report({ equipment: [{ id: "mini-excavator", label: LABEL, owner: "BTN", hours: 5 }] }),
      report({ equipment: [{ id: "mini-excavator", label: LABEL, owner: "RENTAL", hours: 6 }] }),
    ]);
    expect(split).toHaveLength(1);
    expect(split[0]).toMatchObject({ ours: 5, theirs: 6 });
  });
});

describe("byClient", () => {
  it("collapses two spellings of one client into one row", () => {
    const clients = byClient([
      report({ clientName: "Weinstein Residence" }),
      report({ clientName: "  weinstein residence " }),
    ]);
    expect(clients).toHaveLength(1);
    // The first spelling seen is the one shown — not the folded key.
    expect(clients[0].clientName).toBe("Weinstein Residence");
    expect(clients[0].reports).toBe(2);
  });

  it("ranks by hours and gathers every job number the client was billed under", () => {
    const clients = byClient([
      report({ clientName: "A", jobNumbers: ["1"], totals: totals({ crewHours: 10 }) }),
      report({ clientName: "A", jobNumbers: ["2"], totals: totals({ crewHours: 10 }) }),
      report({ clientName: "B", jobNumbers: ["3"], totals: totals({ crewHours: 30 }) }),
    ]);
    expect(clients.map((c) => c.clientName)).toEqual(["B", "A"]);
    expect(clients[1].jobNumbers).toEqual(["1", "2"]);
  });
});

describe("calendar", () => {
  const days = ["2026-08-03", "2026-08-04", "2026-08-05"];
  const foremen = [{ userId: "user-1", name: "Aguilar, Miguel", crewMemberId: "aguilar-miguel" }];

  it("gives a day nobody filed a null rather than a zero", () => {
    const [row] = calendar([report({ date: "2026-08-03" })], days, foremen);
    expect(row.cells[0].crewHours).toBe(27);
    // The gap is the whole point of this view: zero hours worked and no report
    // at all are different facts, and only one of them needs a phone call.
    expect(row.cells[1].crewHours).toBeNull();
    expect(row.cells[2].crewHours).toBeNull();
  });

  it("adds up two reports the same foreman filed on one day", () => {
    const [row] = calendar(
      [
        report({ date: "2026-08-04", totals: totals({ crewHours: 10 }) }),
        report({ date: "2026-08-04", totals: totals({ crewHours: 5 }) }),
      ],
      days,
      foremen
    );
    expect(row.cells[1]).toMatchObject({ crewHours: 15, reports: 2 });
  });

  it("keeps a foreman who filed nothing all range as an empty row", () => {
    const rows = calendar([], days, foremen);
    expect(rows).toHaveLength(1);
    expect(rows[0].reports).toBe(0);
  });

  it("puts work nobody signed for in its own row, at the bottom", () => {
    const rows = calendar([report({ submittedBy: undefined })], days, foremen);
    expect(rows).toHaveLength(2);
    expect(rows[1].foreman).toBeNull();
    expect(rows[1].reports).toBe(1);
  });

  it("marks a cell as flagged so a bad day is visible before it is opened", () => {
    const [row] = calendar(
      [report({ date: "2026-08-05", flags: [{ key: "warnNoHours", field: "crew" }] })],
      days,
      foremen
    );
    expect(row.cells[2].flagged).toBe(true);
  });
});

describe("delta", () => {
  it("refuses to divide by a period that was empty", () => {
    expect(delta(10, 0)).toBeNull();
  });

  it("reads a halving as -50%", () => {
    expect(delta(50, 100)).toBeCloseTo(-0.5);
  });
});

describe("groupBy", () => {
  const nameOf = (id: string) => ({ "user-1": "Aguilar, Miguel", "user-2": "Tix Tix, Domingo" })[id] ?? id;

  it("groups by the Monday of the week, not by the date", () => {
    const rows = groupBy(
      [report({ date: "2026-08-03" }), report({ date: "2026-08-08" })],
      "week",
      nameOf
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("2026-08-03");
    expect(rows[0].reports).toBe(2);
  });

  it("folds client spellings the same way the summary does", () => {
    const rows = groupBy(
      [report({ clientName: "Hollis Pool Deck" }), report({ clientName: " hollis pool deck " })],
      "client",
      nameOf
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("Hollis Pool Deck");
  });

  it("puts reports with no foreman in their own bucket rather than dropping them", () => {
    const rows = groupBy(
      [report({ submittedBy: "user-1" }), report({ submittedBy: undefined })],
      "foreman",
      nameOf
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.key === "")?.reports).toBe(1);
  });

  it("carries every measure the summary tiles show", () => {
    const [row] = groupBy(
      [
        report({
          totals: totals({ crewHours: 30, onSiteHours: 8, travelHours: 2, materialsCost: 500 }),
          equipment: [{ id: "loader", label: LABEL, owner: "RENTAL", hours: 7 }],
          materials: [{ id: "mulch", label: LABEL, source: "BTN", cost: 500 }],
        }),
      ],
      "week",
      nameOf
    );
    expect(row).toMatchObject({
      crewHours: 30,
      onSiteHours: 8,
      travelHours: 2,
      materialsCost: 500,
      yardCost: 500,
      rentalHours: 7,
    });
    expect(row.travelShare).toBeCloseTo(0.2);
  });
});

describe("sortRows", () => {
  const rows = groupBy(
    [
      report({ date: "2026-08-08", totals: totals({ crewHours: 10 }) }),
      report({ date: "2026-08-03", totals: totals({ crewHours: 40 }) }),
    ],
    "day",
    (id) => id
  );

  it("reads a week or a day as a sequence, not as a ranking", () => {
    expect(sortRows(rows, null, "day").map((row) => row.key)).toEqual([
      "2026-08-03",
      "2026-08-08",
    ]);
  });

  it("ranks by the measure asked for, biggest first", () => {
    expect(sortRows(rows, "crewHours", "day").map((row) => row.crewHours)).toEqual([40, 10]);
  });

  it("sorts an unanswerable share last rather than as zero", () => {
    const mixed = groupBy(
      [
        report({ date: "2026-08-03", totals: totals({ onSiteHours: null, travelHours: null }) }),
        report({ date: "2026-08-04", totals: totals({ onSiteHours: 9, travelHours: 1 }) }),
      ],
      "day",
      (id) => id
    );
    const sorted = sortRows(mixed, "travelShare", "day");
    expect(sorted[0].travelShare).not.toBeNull();
    expect(sorted[1].travelShare).toBeNull();
  });
});

describe("payroll", () => {
  const row = (over: Partial<PayrollRow> = {}): PayrollRow => ({
    personId: "sumba-flavio",
    name: "Sumba, Flavio",
    date: "2026-08-03",
    hours: 8,
    adhoc: false,
    ...over,
  });

  it("counts two crews in one day as one day worked", () => {
    const [person] = payroll([row({ hours: 5 }), row({ hours: 4 })]);
    expect(person.hours).toBe(9);
    expect(person.daysWorked).toBe(1);
  });

  it("counts a day as recorded when any one of its rows has hours", () => {
    const [person] = payroll([row({ hours: null }), row({ hours: 6 })]);
    expect(person.daysMissingHours).toBe(0);
  });

  it("flags a day nobody wrote hours on — the number payroll acts on", () => {
    const [person] = payroll([
      row({ date: "2026-08-03", hours: 8 }),
      row({ date: "2026-08-04", hours: null }),
    ]);
    expect(person.daysWorked).toBe(2);
    expect(person.daysMissingHours).toBe(1);
    // The total is short by exactly the day nobody recorded, which is why the
    // second number has to be on the screen next to it.
    expect(person.hours).toBe(8);
  });

  it("collapses written-in names on the name, since they have no roster id", () => {
    const people = payroll([
      row({ personId: null, name: "Juan", adhoc: true }),
      row({ personId: null, name: " juan ", adhoc: true, date: "2026-08-04" }),
    ]);
    expect(people).toHaveLength(1);
    expect(people[0].daysWorked).toBe(2);
  });

  it("keeps two roster people apart even when the names look alike", () => {
    const people = payroll([
      row({ personId: "aguilar-miguel", name: "Aguilar, Miguel" }),
      row({ personId: "aguilar-danny", name: "Aguilar, Danny" }),
    ]);
    expect(people).toHaveLength(2);
  });
});

describe("outstanding", () => {
  it("counts what the office still has to chase, from the stored flags", () => {
    const pile = outstanding([
      report({ status: "needs_review", flags: [{ key: "warnNoHours", field: "crew" }] }),
      report({ flags: [{ key: "warnLongDay", field: "times" }] }),
      report({ submittedBy: undefined }),
    ]);
    expect(pile).toEqual({
      needsReview: 1,
      missingHours: 1,
      unattributed: 1,
      longDays: 1,
      noCrew: 0,
    });
  });
});
