import { describe, expect, it } from "vitest";
import { safeNext } from "../SignInForm";

/**
 * Where the sign-in form sends you afterwards.
 *
 * This is the one function on the door with a security consequence, which is
 * why it is tested at all: `?next=` arrives from the URL bar, so anything it is
 * allowed to return is somewhere an attacker can deposit a manager who has just
 * typed a password. The interesting cases are not the happy ones — they are the
 * strings that *look* like a console path and are not.
 */
describe("safeNext", () => {
  it("keeps a path inside the console", () => {
    expect(safeNext("/office")).toBe("/office");
    expect(safeNext("/office/reportes")).toBe("/office/reportes");
    expect(safeNext("/office/reportes/abc123")).toBe("/office/reportes/abc123");
  });

  it("keeps the query string, which carries the search a reader had open", () => {
    expect(safeNext("/office/reportes?desde=2026-01-01")).toBe("/office/reportes?desde=2026-01-01");
  });

  it("falls back to the console when nothing was asked for", () => {
    expect(safeNext(null)).toBe("/office");
    expect(safeNext("")).toBe("/office");
  });

  it("refuses an absolute URL — the open redirect this guard exists for", () => {
    expect(safeNext("https://evil.example/steal")).toBe("/office");
    expect(safeNext("http://evil.example")).toBe("/office");
    expect(safeNext("javascript:alert(1)")).toBe("/office");
  });

  /*
   * The one a `startsWith("/")` test alone would let through. A browser reads
   * `//evil.example` as protocol-relative and navigates off-site, so it is an
   * absolute URL wearing a path's clothes.
   */
  it("refuses a protocol-relative URL", () => {
    expect(safeNext("//evil.example")).toBe("/office");
    expect(safeNext("//evil.example/office")).toBe("/office");
  });

  /*
   * And the one a `startsWith("/office")` test alone would let through:
   * `/officexyz` shares the prefix and is a different route entirely.
   */
  it("refuses a path that merely starts with the console's name", () => {
    expect(safeNext("/officexyz")).toBe("/office");
    expect(safeNext("/office-evil/page")).toBe("/office");
  });

  it("refuses a path outside the console", () => {
    expect(safeNext("/reporte")).toBe("/office");
    expect(safeNext("/inicio")).toBe("/office");
  });
});
