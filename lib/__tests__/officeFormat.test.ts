import { describe, expect, it } from "vitest";
import { clockTime, filedAtTime, hours, money, moneyExact } from "../officeFormat";

describe("hours", () => {
  it("drops trailing zeros", () => {
    expect(hours(8)).toBe("8");
    expect(hours(8.5)).toBe("8.5");
    expect(hours(7.25)).toBe("7.25");
  });

  /**
   * The distinction the whole crew table turns on: nobody wrote the hours down
   * is not the same fact as nobody worked, and payroll acts on the difference.
   */
  it("keeps 'not recorded' apart from zero", () => {
    expect(hours(null)).toBeNull();
    expect(hours(0)).toBe("0");
  });

  it("does not print float drift at a project manager", () => {
    expect(hours(0.1 + 0.2)).toBe("0.3");
  });
});

describe("money", () => {
  it("rounds for the numbers across the top, where cents are noise", () => {
    expect(money(1550.5)).toBe("$1,551");
    expect(money(0)).toBe("$0");
  });

  it("keeps the cents on a line item somebody may reconcile", () => {
    expect(moneyExact(1240.5)).toBe("$1,240.50");
    expect(moneyExact(310)).toBe("$310.00");
  });
});

describe("clockTime", () => {
  it("reads a stored 24-hour time the way the office says it", () => {
    expect(clockTime("06:30")).toBe("6:30 AM");
    expect(clockTime("15:45")).toBe("3:45 PM");
    expect(clockTime("00:05")).toBe("12:05 AM");
    expect(clockTime("12:00")).toBe("12:00 PM");
  });

  /** An unfilled time is empty on the form and must stay empty on the screen. */
  it("passes anything that is not a time straight through", () => {
    expect(clockTime("")).toBe("");
    expect(clockTime("—")).toBe("—");
  });
});

describe("filedAtTime", () => {
  it("shows the hour a report landed", () => {
    // Fixed offset rather than a zone name, so the expectation does not depend
    // on the machine running the test.
    expect(filedAtTime("2026-08-09T21:12:04.000Z", "en-US")).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  it("prints nothing for a stamp it cannot read", () => {
    expect(filedAtTime("not a date")).toBe("");
  });
});
