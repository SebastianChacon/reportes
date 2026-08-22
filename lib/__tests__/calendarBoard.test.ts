import { describe, expect, it } from "vitest";
import {
  ORDER_STEP,
  clampBar,
  clampColumns,
  columnAt,
  columnDate,
  columnsOf,
  drawBar,
  renumber,
  reorderRow,
  resizeBar,
  rowsOfSection,
  shiftBar,
  tidyBars,
  todayColumn,
  todayOffset,
  type Bar,
  type BoardRow,
} from "../calendarBoard";
import { calendarSeed } from "../calendarSeed";

/**
 * The board's arithmetic.
 *
 * What can actually break on this screen is not the markup — it is the
 * geometry, and every bit of it is reachable by a hand that dragged too far.
 * These are the cases a mouse produces in the first minute of use: a stroke
 * drawn right to left, a bar shoved past the end of the ruler, a row moved off
 * the top of its group, a board shortened underneath work already on it.
 */

const bar = (start: number, span: number): Bar => ({ id: "b", start, span, color: "red" });

const row = (id: string, section: string, order: number): BoardRow => ({
  id,
  boardKey: "production",
  section,
  order,
  label: id,
  color: "ink",
  bars: [],
});

describe("clampColumns", () => {
  it("keeps a board inside the range a person can read", () => {
    expect(clampColumns(20)).toBe(20);
    expect(clampColumns(0)).toBe(1);
    expect(clampColumns(5_000)).toBe(104);
    // A field emptied in the browser arrives as NaN, not as zero.
    expect(clampColumns(Number.NaN)).toBe(1);
  });
});

describe("clampBar", () => {
  it("clips a bar to the ruler instead of rejecting it", () => {
    expect(clampBar(bar(18, 9), 20)).toMatchObject({ start: 18, span: 2 });
    expect(clampBar(bar(-4, 3), 20)).toMatchObject({ start: 0, span: 3 });
  });

  it("never leaves a bar too small to grab back", () => {
    expect(clampBar(bar(3, 0), 20).span).toBe(1);
    expect(clampBar(bar(3, -2), 20).span).toBe(1);
  });

  it("survives the board being shortened underneath it", () => {
    // The bar was drawn on a twenty-week board; the ruler is now four columns.
    expect(clampBar(bar(11, 3), 4)).toMatchObject({ start: 3, span: 1 });
  });
});

describe("drawBar", () => {
  it("does not care which way the hand moved", () => {
    expect(drawBar(2, 6, 20)).toEqual({ start: 2, span: 5 });
    expect(drawBar(6, 2, 20)).toEqual({ start: 2, span: 5 });
  });

  it("gives a single column to a press that never moved", () => {
    expect(drawBar(4, 4, 20)).toEqual({ start: 4, span: 1 });
  });

  it("stops at the ends of the ruler", () => {
    expect(drawBar(-3, 25, 20)).toEqual({ start: 0, span: 20 });
  });
});

describe("shiftBar", () => {
  it("keeps the length when the bar hits an edge", () => {
    const three = { ...bar(17, 3), id: "x" };
    expect(shiftBar(three, 5, 20)).toMatchObject({ start: 17, span: 3 });
    expect(shiftBar(three, -30, 20)).toMatchObject({ start: 0, span: 3 });
  });
});

describe("resizeBar", () => {
  it("moves the edge that was grabbed and leaves the other one alone", () => {
    expect(resizeBar(bar(4, 4), "end", 9, 20)).toMatchObject({ start: 4, span: 6 });
    expect(resizeBar(bar(4, 4), "start", 1, 20)).toMatchObject({ start: 1, span: 7 });
  });

  it("flips rather than collapsing when an edge is dragged past the other", () => {
    // A hand does this constantly. Collapsing to nothing would delete the bar
    // mid-gesture and leave the person dragging a bar that no longer exists.
    expect(resizeBar(bar(4, 4), "start", 10, 20)).toMatchObject({ start: 7, span: 4 });
  });
});

describe("columnAt", () => {
  it("maps a point in the track to a column", () => {
    expect(columnAt(0, 200, 20)).toBe(0);
    expect(columnAt(105, 200, 20)).toBe(10);
    // Past the right edge, and a zero-width box during the first layout pass.
    expect(columnAt(1_000, 200, 20)).toBe(19);
    expect(columnAt(50, 0, 20)).toBe(0);
  });
});

describe("columnsOf", () => {
  const board = { startDate: "2026-08-24", scale: "week" as const, columns: 20 };

  it("walks a weekly ruler forward one Monday at a time", () => {
    const columns = columnsOf(board);
    expect(columns[0].iso).toBe("2026-08-24");
    expect(columns[1].iso).toBe("2026-08-31");
    expect(columns[19].iso).toBe(columnDate(board, 19));
  });

  it("labels a month only on the column that opens it", () => {
    const columns = columnsOf(board);
    expect(columns[0].month).toBe("Aug");
    expect(columns[1].month).toBe(null);
    // 7 September is the first Monday of its month.
    expect(columns[2].month).toBe("Sep");
  });

  it("names the year only when January opens", () => {
    const columns = columnsOf(board);
    const january = columns.find((column) => column.month === "Jan");
    expect(january?.year).toBe(2027);
    expect(columns[0].year).toBe(null);
  });

  it("marks the weekend on a daily ruler", () => {
    const daily = columnsOf({ startDate: "2026-08-24", scale: "day", columns: 7 });
    expect(daily.map((column) => column.weekend)).toEqual([
      false, false, false, false, false, true, true,
    ]);
    expect(daily[0].weekday).toBe("M");
  });
});

describe("todayColumn", () => {
  const board = { startDate: "2026-08-24", scale: "week" as const, columns: 20 };

  it("finds the week today falls in", () => {
    expect(todayColumn(board, "2026-08-24")).toBe(0);
    expect(todayColumn(board, "2026-08-30")).toBe(0);
    expect(todayColumn(board, "2026-08-31")).toBe(1);
  });

  it("answers null when today is not on this board at all", () => {
    // The regression the previous board shipped with: it drew the line anyway,
    // and people read a public holiday as "now".
    expect(todayColumn(board, "2026-08-20")).toBe(null);
    expect(todayColumn(board, "2027-06-01")).toBe(null);
    expect(todayOffset(board, "2026-08-20")).toBe(null);
  });

  it("puts the line partway through its own column", () => {
    // Thursday of the first week: three days into a seven-day column.
    expect(todayOffset(board, "2026-08-27")).toBeCloseTo(3 / 7 / 20, 6);
  });
});

describe("tidyBars", () => {
  it("clips and orders every stroke on a line", () => {
    const tidied = tidyBars(
      [
        { id: "b", start: 9, span: 40, color: "red" },
        { id: "a", start: 2, span: 2, color: "green" },
      ],
      20
    );
    expect(tidied.map((one) => one.id)).toEqual(["a", "b"]);
    expect(tidied[1]).toMatchObject({ start: 9, span: 11 });
  });
});

describe("reorderRow", () => {
  const rows = [
    row("a", "one", 100),
    row("b", "one", 200),
    row("c", "one", 300),
    row("d", "two", 400),
  ];

  it("swaps a row with its neighbour, reusing the section's own numbers", () => {
    expect(reorderRow(rows, "b", "up")).toEqual([
      { id: "b", order: 100 },
      { id: "a", order: 200 },
      { id: "c", order: 300 },
    ]);
  });

  it("refuses a move that would leave the group", () => {
    expect(reorderRow(rows, "a", "up")).toEqual([]);
    expect(reorderRow(rows, "c", "down")).toEqual([]);
    // A row somebody else deleted while this screen still showed it.
    expect(reorderRow(rows, "gone", "up")).toEqual([]);
  });

  it("never renumbers past the section below it", () => {
    // The trap: handing out fresh numbers would push "one" over "two", because
    // the gap between two groups is only a run of orders nobody holds.
    const orders = reorderRow(rows, "c", "up");
    expect(Math.max(...orders.map((entry) => entry.order))).toBeLessThan(400);
  });

  it("separates two rows that were tied", () => {
    const tied = [row("a", "one", 100), row("b", "one", 100), row("c", "one", 200)];
    const orders = reorderRow(tied, "c", "up");
    const numbers = orders.map((entry) => entry.order);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});

describe("renumber", () => {
  it("spaces a whole board out again, section by section", () => {
    const rows = [row("a", "one", 100), row("b", "two", 50), row("c", "one", 100)];
    const orders = renumber(rows, [
      { id: "one", title: "" },
      { id: "two", title: "" },
    ]);

    expect(orders.map((entry) => entry.id)).toEqual(["a", "c", "b"]);
    expect(orders.map((entry) => entry.order)).toEqual([
      ORDER_STEP,
      ORDER_STEP * 2,
      ORDER_STEP * 3,
    ]);
  });
});

describe("rowsOfSection", () => {
  it("takes one group, in order, and leaves the rest", () => {
    const rows = [row("b", "one", 200), row("d", "two", 50), row("a", "one", 100)];
    expect(rowsOfSection(rows, "one").map((one) => one.id)).toEqual(["a", "b"]);
  });
});

describe("calendarSeed", () => {
  const seed = calendarSeed();

  it("transcribes both boards off the wall", () => {
    expect(seed.boards.map((board) => board.key)).toEqual(["production", "enhancements"]);
    expect(seed.rows.length).toBeGreaterThan(20);
  });

  it("leaves every bar inside its own ruler", () => {
    // The seed is written by hand from a photograph, so this is the test that
    // catches a typo before it becomes a bar hanging off the end of the board.
    for (const board of seed.boards) {
      for (const seeded of seed.rows.filter((one) => one.boardKey === board.key)) {
        for (const one of seeded.bars) {
          expect(one.start).toBeGreaterThanOrEqual(0);
          expect(one.start + one.span).toBeLessThanOrEqual(board.columns);
        }
      }
    }
  });

  it("gives every row and bar an id of its own", () => {
    const ids = seed.rows.flatMap((one) => one.bars.map((each) => each.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts every row in a group its board declares", () => {
    for (const board of seed.boards) {
      const sections = new Set(board.sections.map((section) => section.id));
      for (const seeded of seed.rows.filter((one) => one.boardKey === board.key)) {
        expect(sections.has(seeded.section)).toBe(true);
      }
    }
  });

  it("is the same board twice, so seeding is repeatable", () => {
    expect(calendarSeed()).toEqual(seed);
  });
});
