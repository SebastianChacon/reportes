import { describe, expect, it } from "vitest";
import { owns } from "../ConsoleNav";

/**
 * Which tab lights up, per URL.
 *
 * Worth its own test because the failure is silent: the console still works
 * perfectly with no tab highlighted, so nothing crashes and no test that renders
 * a page notices. It just stops telling the reader where they are, which is the
 * kind of regression that survives a whole release.
 */
describe("owns", () => {
  const DAY = "/office";
  const SUMMARY = "/office/resumen";
  const SEARCH = "/office/reportes";

  it("gives the day only its own URL", () => {
    expect(owns("/office", DAY)).toBe(true);

    // The prefix trap: every route in the console starts with `/office`, so a
    // prefix test here would light "The day" on all of them.
    expect(owns("/office/resumen", DAY)).toBe(false);
    expect(owns("/office/reportes", DAY)).toBe(false);
    expect(owns("/office/personas/miguel", DAY)).toBe(false);
  });

  it("gives the summary its own subtree", () => {
    expect(owns("/office/resumen", SUMMARY)).toBe(true);

    // The bug this function was written for: two levels into the summary and no
    // tab was lit at all.
    expect(owns("/office/resumen/avanzado", SUMMARY)).toBe(true);
  });

  it("leaves a single report to nobody", () => {
    // Reached from the day and from the search alike, so neither claims it —
    // the breadcrumb above the report orients that page instead.
    expect(owns("/office/reportes/abc123", SEARCH)).toBe(false);
    expect(owns("/office/reportes/abc123", DAY)).toBe(false);
    expect(owns("/office/reportes/clave/job-99", SEARCH)).toBe(false);

    // The search list itself still lights its own tab.
    expect(owns("/office/reportes", SEARCH)).toBe(true);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(owns("/office/resumenes", SUMMARY)).toBe(false);
    expect(owns("/office/reportesX", SEARCH)).toBe(false);
  });
});
