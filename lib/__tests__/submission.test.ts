import { describe, expect, it } from "vitest";
import { buildSubmission, personIdOf, submissionKey } from "../submission";
import { crewTotalHours, totalDayHours, warnings } from "../calc";
import { emptyReport, type JobReport } from "../types";

/** A report that passes every soft check, so a test can break one thing at a time. */
function goodReport(over: Partial<JobReport> = {}): JobReport {
  return {
    ...emptyReport("es"),
    date: "2026-08-07",
    clientName: "Salazar",
    jobNumbers: ["21550"],
    truckNumbers: ["28"],
    startYard: "07:00",
    startJob: "07:35",
    endJob: "16:00",
    endYard: "16:30",
    lunchMinutes: 30,
    crew: [
      { id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F", "D"], hours: 9 },
      { id: "montes-cesar", name: "Montes, Cesar", roles: ["M"], hours: 9 },
    ],
    description: { ...emptyReport("es").description, original: "Instalamos borde de piedra azul." },
    ...over,
  };
}

describe("submissionKey", () => {
  it("uses the report's own id", () => {
    const report = goodReport({ id: "abc-123" });
    expect(submissionKey(report)).toBe("abc-123");
  });

  it("is stable across retries of the same report", () => {
    const report = goodReport();
    expect(submissionKey(report)).toBe(submissionKey({ ...report }));
  });

  it("differs between two reports started separately", () => {
    expect(submissionKey(goodReport())).not.toBe(submissionKey(goodReport()));
  });

  it("derives a stable key for a report queued before ids existed", () => {
    const legacy = goodReport({ id: undefined, submittedAt: "2026-08-07T20:41:00.000Z" });
    const replay = { ...legacy };

    expect(submissionKey(legacy)).toBe(submissionKey(replay));
    expect(submissionKey(legacy)).toContain("2026-08-07");
    expect(submissionKey(legacy)).toContain("salazar");
  });

  it("keeps two legacy reports for different clients on the same day apart", () => {
    const a = goodReport({ id: undefined, submittedAt: "2026-08-07T20:41:00.000Z" });
    const b = goodReport({
      id: undefined,
      clientName: "Whitmore",
      submittedAt: "2026-08-07T20:41:00.000Z",
    });
    expect(submissionKey(a)).not.toBe(submissionKey(b));
  });
});

describe("personIdOf", () => {
  it("keeps the roster id for someone picked from the list", () => {
    expect(personIdOf({ id: "aguilar-miguel" })).toBe("aguilar-miguel");
  });

  it("refuses to treat a written-in name as a person", () => {
    // StepCrew stamps these `adhoc-<name>-<timestamp>`: unique per report, so
    // storing it as a personId would invent a new person on every report.
    expect(personIdOf({ id: "adhoc-benjamin-mozza-1754600000000", adhoc: true })).toBeNull();
  });
});

describe("buildSubmission — totals", () => {
  it("stores exactly what calc.ts computes", () => {
    const report = goodReport();
    const { report: stored } = buildSubmission(report);

    expect(stored.totals.dayHours).toBe(totalDayHours(report));
    expect(stored.totals.crewHours).toBe(crewTotalHours(report));
    expect(stored.totals.dayHours).toBe(9);
    expect(stored.totals.onSiteHours).toBe(7.92);
    expect(stored.totals.travelHours).toBe(1.08);
  });

  it("carries material and plant cost into one number", () => {
    const report = goodReport({
      materials: [
        { id: "mulch", label: { en: "Mulch", es: "Mantillo" }, source: "BTN", qty: 4, cost: 120 },
      ],
      plants: [
        { id: "p1", category: "tree", name: "Red Maple", qty: 2, size: "8ft", vendor: "Braen", cost: 380 },
      ],
    });

    expect(buildSubmission(report).report.totals.materialsCost).toBe(500);
  });

  it("leaves totals null rather than guessing when the times are incomplete", () => {
    const { report: stored } = buildSubmission(goodReport({ endYard: "" }));
    expect(stored.totals.dayHours).toBeNull();
    expect(stored.totals.travelHours).toBeNull();
    // Crew hours are typed in by hand, so they survive missing times.
    expect(stored.totals.crewHours).toBe(18);
  });
});

describe("buildSubmission — flags and status", () => {
  it("files a clean report as submitted", () => {
    const { report: stored } = buildSubmission(goodReport());
    expect(stored.flags).toEqual([]);
    expect(stored.status).toBe("submitted");
  });

  it("puts a long day straight into the review queue", () => {
    const report = goodReport({ startYard: "04:00", startJob: "05:00", endJob: "21:30", endYard: "22:00" });
    const { report: stored } = buildSubmission(report);

    expect(stored.flags.map((f) => f.key)).toContain("warnLongDay");
    expect(stored.status).toBe("needs_review");
  });

  it("flags a crew member left without hours", () => {
    const report = goodReport({
      crew: [
        { id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F"], hours: 9 },
        { id: "montes-cesar", name: "Montes, Cesar", roles: ["M"], hours: null },
      ],
    });
    const { report: stored } = buildSubmission(report);

    expect(stored.flags.map((f) => f.key)).toContain("warnNoHours");
    expect(stored.status).toBe("needs_review");
  });

  it("stores the same flags calc.ts reports, with field normalised to null", () => {
    const report = goodReport({ crew: [] });
    const { report: stored } = buildSubmission(report);

    expect(stored.flags).toEqual(
      warnings(report).map((w) => ({ key: w.key, field: w.field ?? null }))
    );
  });
});

describe("buildSubmission — crewDays fan-out", () => {
  it("writes one row per crew member", () => {
    const { crewDays } = buildSubmission(goodReport());

    expect(crewDays).toHaveLength(2);
    expect(crewDays.map((c) => c.personId)).toEqual(["aguilar-miguel", "montes-cesar"]);
    expect(crewDays.map((c) => c.hours)).toEqual([9, 9]);
  });

  it("denormalises the day and job so the person view needs no join", () => {
    const [row] = buildSubmission(goodReport()).crewDays;

    expect(row.date).toBe("2026-08-07");
    expect(row.clientName).toBe("Salazar");
    expect(row.jobNumber).toBe("21550");
    expect(row.roles).toEqual(["F", "D"]);
  });

  it("gives a written-in name a row with no personId", () => {
    const report = goodReport({
      crew: [
        { id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F"], hours: 9 },
        { id: "adhoc-benjamin-mozza-1754600000000", name: "Benjamin Mozza", roles: [], hours: 8, adhoc: true },
      ],
    });
    const { crewDays } = buildSubmission(report);

    expect(crewDays[1]).toMatchObject({ personId: null, name: "Benjamin Mozza", adhoc: true, hours: 8 });
  });

  it("keeps both halves when one person is moved between crews mid-day", () => {
    // Miguel starts on Salazar and finishes on Bergen: two reports, same date,
    // and the person view has to add them up rather than show one.
    const morning = buildSubmission(
      goodReport({ crew: [{ id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F"], hours: 4.5 }] })
    );
    const afternoon = buildSubmission(
      goodReport({
        clientName: "Bergen Estate",
        jobNumbers: ["21571"],
        crew: [{ id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F"], hours: 3 }],
      })
    );

    const rows = [...morning.crewDays, ...afternoon.crewDays].filter(
      (r) => r.personId === "aguilar-miguel" && r.date === "2026-08-07"
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.jobNumber)).toEqual(["21550", "21571"]);
    expect(rows.reduce((sum, r) => sum + (r.hours ?? 0), 0)).toBe(7.5);
  });

  it("records no crew rows for a report filed without a crew", () => {
    expect(buildSubmission(goodReport({ crew: [] })).crewDays).toEqual([]);
  });

  it("stores a null jobNumber rather than inventing one", () => {
    const [row] = buildSubmission(goodReport({ jobNumbers: [] })).crewDays;
    expect(row.jobNumber).toBeNull();
  });
});

describe("buildSubmission — the rest of the record", () => {
  it("keeps the original text and its cached translation together", () => {
    const report = goodReport();
    report.description.translation = "Installed bluestone edge.";
    report.description.translationLang = "en";
    report.description.unknownTerms = ["polimerica"];

    const { report: stored } = buildSubmission(report);

    expect(stored.description.original).toBe("Instalamos borde de piedra azul.");
    expect(stored.description.translation).toBe("Installed bluestone edge.");
    expect(stored.description.unknownTerms).toEqual(["polimerica"]);
  });

  it("counts photos without carrying the image data", () => {
    const report = goodReport({ photos: ["data:image/jpeg;base64,AAA", "data:image/jpeg;base64,BBB"] });
    const { report: stored } = buildSubmission(report);

    expect(stored.photoCount).toBe(2);
    expect(JSON.stringify(stored)).not.toContain("base64");
  });

  it("stamps submittedAt when the report has not got one yet", () => {
    const { report: stored } = buildSubmission(goodReport(), "2026-08-07T20:41:00.000Z");
    expect(stored.submittedAt).toBe("2026-08-07T20:41:00.000Z");
  });

  it("keeps the submittedAt a queued report was sent with", () => {
    const queued = goodReport({ submittedAt: "2026-08-07T20:41:00.000Z" });
    expect(buildSubmission(queued).report.submittedAt).toBe("2026-08-07T20:41:00.000Z");
  });

  it("survives a report replayed from an older build with fields missing", () => {
    // The outbox can hold a report written before `photos` or `unknownTerms`
    // existed; a crash here would strand it forever.
    const partial = { ...goodReport(), unknownTerms: undefined } as unknown as JobReport;
    delete (partial as { photos?: string[] }).photos;
    partial.description = { ...partial.description, unknownTerms: undefined as unknown as string[] };

    expect(() => buildSubmission({ ...partial, photos: partial.photos ?? [] })).not.toThrow();
    const { report: stored } = buildSubmission({ ...partial, photos: partial.photos ?? [] });
    expect(stored.description.unknownTerms).toEqual([]);
    expect(stored.photoCount).toBe(0);
  });
});
