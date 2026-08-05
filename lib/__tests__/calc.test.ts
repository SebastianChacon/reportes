import { describe, expect, it } from "vitest";
import { missingRequired, toMinutes, totalDayHours } from "../calc";
import { emptyReport, type JobReport } from "../types";

describe("toMinutes with reports from an older schema", () => {
  it("parses a normal time", () => {
    expect(toMinutes("07:45")).toBe(465);
  });

  it("returns null instead of throwing when the time field is absent", () => {
    // An outbox entry queued before the time fields existed replays as undefined,
    // which used to crash the send-report route with a 502.
    expect(toMinutes(undefined as unknown as string)).toBeNull();
    expect(toMinutes(null as unknown as string)).toBeNull();
  });

  it("keeps totalDayHours safe for such a report", () => {
    const legacy = { ...emptyReport("en"), startYard: undefined, endYard: undefined } as unknown as JobReport;
    expect(() => totalDayHours(legacy)).not.toThrow();
    expect(totalDayHours(legacy)).toBeNull();
  });
});

describe("missingRequired", () => {
  it("flags jobNumbers as missing when the list is empty", () => {
    const report = emptyReport("en");
    expect(missingRequired(report)).toContain("jobNumbers");
  });

  it("stops flagging jobNumbers once at least one number is present", () => {
    const report = { ...emptyReport("en"), jobNumbers: ["21550"] };
    expect(missingRequired(report)).not.toContain("jobNumbers");
  });

  it("does not require truckNumbers", () => {
    const report = {
      ...emptyReport("en"),
      clientName: "Salazar",
      jobNumbers: ["21550"],
      description: { ...emptyReport("en").description, original: "Mowed the lawn" },
    };
    expect(missingRequired(report)).toEqual([]);
  });
});
