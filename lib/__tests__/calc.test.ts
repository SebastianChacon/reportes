import { describe, expect, it } from "vitest";
import { missingRequired } from "../calc";
import { emptyReport } from "../types";

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
