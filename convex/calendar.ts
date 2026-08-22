import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { calendarBar, calendarBoardFields, markerColor } from "./validators";

/**
 * The production board: reads and writes.
 *
 * Unlike the rest of the console, this table is *written* from a screen. That
 * changes what the functions here have to defend against, because the caller is
 * a person dragging a bar around with a mouse rather than a form that was
 * validated on its way in:
 *
 * - **Nothing here trusts a number.** Every start and span is clipped to the
 *   board's own ruler at write time, so shortening a board can never leave a
 *   stored bar hanging off the end of it — and no reader has to cope with one.
 * - **A write is one row.** Two people editing the same board touch different
 *   documents, so they do not collide; a whole-board document would have made
 *   the second save silently overwrite the first.
 * - **The geometry is duplicated, deliberately.** `lib/calendarBoard.ts` clips
 *   the same way for the browser. Importing it here would pull `lib/officeDate`
 *   and its `Intl` formatting into the Convex bundle for the sake of four lines
 *   of arithmetic, and the browser's copy is a convenience anyway: this one is
 *   the rule, because it is the one the data cannot get past.
 */

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 104;
const MAX_LABEL = 60;
const MAX_BARS = 40;

function clampColumns(count: number): number {
  if (!Number.isFinite(count)) return MIN_COLUMNS;
  return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.round(count)));
}

function clampBar<T extends { start: number; span: number }>(bar: T, columns: number): T {
  const total = clampColumns(columns);
  const start = Math.max(0, Math.min(Math.round(bar.start), total - 1));
  const span = Math.max(1, Math.min(Math.round(bar.span), total - start));
  return { ...bar, start, span };
}

/** Trimmed and capped. An empty string is stored as absent, never as `""`. */
function text(raw: string | undefined, max = MAX_LABEL): string | undefined {
  const trimmed = raw?.trim().slice(0, max);
  return trimmed ? trimmed : undefined;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const boardShape = v.object({
  key: v.string(),
  title: v.string(),
  scale: v.union(v.literal("week"), v.literal("day")),
  startDate: v.string(),
  columns: v.number(),
  markers: v.array(
    v.object({ id: v.string(), column: v.number(), label: v.string(), color: markerColor })
  ),
  sections: v.array(v.object({ id: v.string(), title: v.string() })),
  updatedAt: v.string(),
});

const rowShape = v.object({
  id: v.id("calendarRows"),
  boardKey: v.string(),
  section: v.string(),
  order: v.number(),
  label: v.string(),
  d: v.optional(v.string()),
  cm: v.optional(v.string()),
  pm: v.optional(v.string()),
  note: v.optional(v.string()),
  color: markerColor,
  bars: v.array(calendarBar),
  updatedAt: v.string(),
});

function asBoard(doc: Doc<"calendarBoards">) {
  return {
    key: doc.key,
    title: doc.title,
    scale: doc.scale,
    startDate: doc.startDate,
    columns: doc.columns,
    markers: doc.markers,
    sections: doc.sections,
    updatedAt: doc.updatedAt,
  };
}

function asRow(doc: Doc<"calendarRows">) {
  return {
    id: doc._id,
    boardKey: doc.boardKey,
    section: doc.section,
    order: doc.order,
    label: doc.label,
    d: doc.d,
    cm: doc.cm,
    pm: doc.pm,
    note: doc.note,
    color: doc.color,
    bars: doc.bars,
    updatedAt: doc.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * Every board and every row, in one call.
 *
 * A full read of two small tables rather than a paged one, and that is a
 * deliberate ceiling: this is a wall in an office, it holds what fits on a wall,
 * and the day it does not, the answer is a second board rather than a scrolling
 * list of four thousand rows. `MAX_ROWS` is where that conversation starts
 * instead of where the page gets slow.
 */
const MAX_ROWS = 500;

export const everything = query({
  args: {},
  returns: v.object({
    boards: v.array(boardShape),
    rows: v.array(rowShape),
    truncated: v.boolean(),
  }),
  handler: async (ctx) => {
    const boards = await ctx.db.query("calendarBoards").collect();

    const rows = [];
    for (const board of boards) {
      const found = await ctx.db
        .query("calendarRows")
        .withIndex("by_board_order", (q) => q.eq("boardKey", board.key))
        .take(MAX_ROWS + 1);
      rows.push(...found);
    }

    return {
      boards: boards.map(asBoard),
      rows: rows.slice(0, MAX_ROWS).map(asRow),
      truncated: rows.length > MAX_ROWS,
    };
  },
});

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/** Who touched it and when, stamped identically by every write in this file. */
const stamp = (updatedBy?: Id<"users">) => ({
  updatedAt: new Date().toISOString(),
  ...(updatedBy ? { updatedBy } : {}),
});

/**
 * The board's own settings: its title, its ruler, its groups, its rules.
 *
 * Creates the board when it does not exist yet, because "set the start date of a
 * board nobody has made" and "make a board starting there" are the same wish,
 * and a screen that has to create before it can edit needs a step that means
 * nothing to the person taking it.
 *
 * Shortening the ruler re-clips every bar on the board. It is the one write here
 * that touches other people's rows, and it has to: the alternative is bars
 * stored past the end of a board, which every reader would then have to guess
 * about.
 */
export const saveBoard = mutation({
  args: {
    key: v.string(),
    title: v.optional(v.string()),
    scale: v.optional(v.union(v.literal("week"), v.literal("day"))),
    startDate: v.optional(v.string()),
    columns: v.optional(v.number()),
    markers: v.optional(calendarBoardFields.markers),
    sections: v.optional(calendarBoardFields.sections),
    updatedBy: v.optional(v.id("users")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendarBoards")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const startDate =
      args.startDate && ISO_DATE.test(args.startDate) ? args.startDate : existing?.startDate;

    const columns = clampColumns(args.columns ?? existing?.columns ?? 20);

    if (existing === null) {
      await ctx.db.insert("calendarBoards", {
        key: args.key,
        title: text(args.title) ?? args.key,
        scale: args.scale ?? "week",
        startDate: startDate ?? new Date().toISOString().slice(0, 10),
        columns,
        markers: (args.markers ?? []).filter((m) => m.column >= 0 && m.column < columns),
        sections: args.sections ?? [{ id: "main", title: "" }],
        ...stamp(args.updatedBy),
      });
      return null;
    }

    await ctx.db.patch(existing._id, {
      ...(args.title !== undefined ? { title: text(args.title) ?? existing.title } : {}),
      ...(args.scale !== undefined ? { scale: args.scale } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      columns,
      // A marker that no longer has a column is dropped rather than pinned to the
      // last one, where it would read as a deadline nobody set.
      ...(args.markers !== undefined
        ? { markers: args.markers.filter((m) => m.column >= 0 && m.column < columns) }
        : { markers: existing.markers.filter((m) => m.column >= 0 && m.column < columns) }),
      ...(args.sections !== undefined ? { sections: args.sections } : {}),
      ...stamp(args.updatedBy),
    });

    if (columns < existing.columns) {
      const rows = await ctx.db
        .query("calendarRows")
        .withIndex("by_board_order", (q) => q.eq("boardKey", args.key))
        .take(MAX_ROWS);

      for (const row of rows) {
        const bars = row.bars.map((bar) => clampBar(bar, columns));
        // Only the rows that actually moved are written — a board of two hundred
        // rows should not produce two hundred writes because one bar was long.
        const changed = bars.some((bar, i) => bar.start !== row.bars[i].start || bar.span !== row.bars[i].span);
        if (changed) await ctx.db.patch(row._id, { bars });
      }
    }

    return null;
  },
});

async function boardOf(ctx: MutationCtx, key: string) {
  return await ctx.db
    .query("calendarBoards")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
}

export const addRow = mutation({
  args: {
    boardKey: v.string(),
    section: v.string(),
    order: v.number(),
    label: v.optional(v.string()),
    color: v.optional(markerColor),
    updatedBy: v.optional(v.id("users")),
  },
  returns: v.id("calendarRows"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("calendarRows", {
      boardKey: args.boardKey,
      section: args.section,
      order: Number.isFinite(args.order) ? args.order : 0,
      label: text(args.label) ?? "",
      color: args.color ?? "ink",
      bars: [],
      ...stamp(args.updatedBy),
    });
  },
});

/**
 * One row, as it now stands.
 *
 * Whole-row rather than field-by-field: the row is what the screen holds, the
 * bars are what change most, and a bar move is a rewrite of the array either
 * way. Last write wins, which is the right rule for a wall — two people editing
 * the same client's dates is a conversation they need to have, not a merge.
 */
export const updateRow = mutation({
  args: {
    rowId: v.id("calendarRows"),
    section: v.optional(v.string()),
    label: v.optional(v.string()),
    d: v.optional(v.string()),
    cm: v.optional(v.string()),
    pm: v.optional(v.string()),
    note: v.optional(v.string()),
    color: v.optional(markerColor),
    bars: v.optional(v.array(calendarBar)),
    updatedBy: v.optional(v.id("users")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.rowId);
    if (row === null) throw new Error("That line is no longer on the board.");

    const board = await boardOf(ctx, row.boardKey);
    const columns = clampColumns(board?.columns ?? MAX_COLUMNS);

    await ctx.db.patch(args.rowId, {
      ...(args.section !== undefined ? { section: args.section } : {}),
      ...(args.label !== undefined ? { label: text(args.label) ?? "" } : {}),
      // The credit columns are cleared by sending an empty string, which `text`
      // turns into `undefined` — otherwise a mistyped initial could never be
      // taken back off the board.
      ...(args.d !== undefined ? { d: text(args.d, 24) } : {}),
      ...(args.cm !== undefined ? { cm: text(args.cm, 12) } : {}),
      ...(args.pm !== undefined ? { pm: text(args.pm, 12) } : {}),
      ...(args.note !== undefined ? { note: text(args.note, 120) } : {}),
      ...(args.color !== undefined ? { color: args.color } : {}),
      ...(args.bars !== undefined
        ? {
            bars: args.bars.slice(0, MAX_BARS).map((bar) => ({
              ...clampBar(bar, columns),
              label: text(bar.label, 40),
            })),
          }
        : {}),
      ...stamp(args.updatedBy),
    });

    return null;
  },
});

export const deleteRow = mutation({
  args: { rowId: v.id("calendarRows") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Deleting something already gone is success, not an error: the second click
    // of a double click must not put a red banner on the screen.
    if (await ctx.db.get(args.rowId)) await ctx.db.delete(args.rowId);
    return null;
  },
});

/**
 * New positions for a run of rows, in one write each.
 *
 * The caller sends the whole affected list rather than a swap, so an order that
 * had already collided comes back apart instead of staying tied forever.
 */
export const reorderRows = mutation({
  args: {
    orders: v.array(v.object({ rowId: v.id("calendarRows"), order: v.number() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const { rowId, order } of args.orders.slice(0, MAX_ROWS)) {
      if (!Number.isFinite(order)) continue;
      if (await ctx.db.get(rowId)) await ctx.db.patch(rowId, { order });
    }
    return null;
  },
});

/**
 * Fill an empty board from the transcription of the photograph.
 *
 * Refuses a board that already has rows on it. The button that calls this is
 * only shown on an empty board, but a button is not a guarantee — two people
 * opening the empty screen at once are, and the second one's click must not
 * duplicate twenty-three clients.
 */
export const seed = mutation({
  args: {
    boards: v.array(
      v.object({
        key: v.string(),
        title: v.string(),
        scale: v.union(v.literal("week"), v.literal("day")),
        startDate: v.string(),
        columns: v.number(),
        markers: calendarBoardFields.markers,
        sections: calendarBoardFields.sections,
      })
    ),
    rows: v.array(
      v.object({
        boardKey: v.string(),
        section: v.string(),
        order: v.number(),
        label: v.string(),
        d: v.optional(v.string()),
        cm: v.optional(v.string()),
        pm: v.optional(v.string()),
        note: v.optional(v.string()),
        color: markerColor,
        bars: v.array(calendarBar),
      })
    ),
    updatedBy: v.optional(v.id("users")),
  },
  returns: v.object({ seeded: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const seeded: string[] = [];

    for (const board of args.boards) {
      const already = await ctx.db
        .query("calendarRows")
        .withIndex("by_board_order", (q) => q.eq("boardKey", board.key))
        .first();
      if (already !== null) continue;

      const existing = await boardOf(ctx, board.key);
      const columns = clampColumns(board.columns);
      const settings = {
        title: board.title,
        scale: board.scale,
        startDate: board.startDate,
        columns,
        markers: board.markers.filter((m) => m.column >= 0 && m.column < columns),
        sections: board.sections,
        ...stamp(args.updatedBy),
      };

      if (existing === null) {
        await ctx.db.insert("calendarBoards", { key: board.key, ...settings });
      } else {
        await ctx.db.patch(existing._id, settings);
      }

      for (const row of args.rows.filter((r) => r.boardKey === board.key)) {
        await ctx.db.insert("calendarRows", {
          ...row,
          bars: row.bars.map((bar) => clampBar(bar, columns)),
          ...stamp(args.updatedBy),
        });
      }

      seeded.push(board.key);
    }

    return { seeded };
  },
});
