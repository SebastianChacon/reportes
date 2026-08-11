import { describe, expect, it } from "vitest";
import { csvFilename, toCsv } from "../csv";

describe("toCsv", () => {
  it("writes a plain table without quoting anything it does not have to", () => {
    expect(toCsv([["Week of", "Hours"], ["2026-08-03", "939.75"]])).toBe(
      "Week of,Hours\r\n2026-08-03,939.75\r\n"
    );
  });

  it("quotes a client name with a comma in it", () => {
    // Unescaped, this shifts every column after it and nobody notices until a
    // number has been read out of the wrong one.
    expect(toCsv([["Weinstein, D.", "12"]])).toBe('"Weinstein, D.",12\r\n');
  });

  it("doubles the quotes inside a quoted field", () => {
    expect(toCsv([['He said "ok"', "1"]])).toBe('"He said ""ok""",1\r\n');
  });

  it("keeps a field with a line break in it on one logical row", () => {
    expect(toCsv([["two\nlines", "1"]])).toBe('"two\nlines",1\r\n');
  });

  it("writes an empty cell as an empty field, never as a zero", () => {
    expect(toCsv([["a", "", "b"]])).toBe("a,,b\r\n");
  });
});

describe("csvFilename", () => {
  it("builds something findable in a downloads folder", () => {
    expect(csvFilename(["resumen", "week", "2026-07-06", "2026-08-10"])).toBe(
      "resumen-week-2026-07-06-2026-08-10.csv"
    );
  });

  it("never produces a name with a path or a space in it", () => {
    expect(csvFilename(["Back to Nature/office", "…"])).toBe("back-to-nature-office.csv");
  });
});
