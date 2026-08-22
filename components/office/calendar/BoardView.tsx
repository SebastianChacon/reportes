"use client";

import React from "react";
import {
  MAX_COLUMNS,
  MIN_COLUMNS,
  columnsOf,
  newId,
  nextOrder,
  rowsOfSection,
  todayOffset,
  type Bar,
  type Board,
  type BoardRow,
} from "@/lib/calendarBoard";
import { shortDate } from "@/lib/officeDate";
import { CONSOLE_LANG, tc, tcf } from "@/lib/i18n";
import { RowLine } from "./RowLine";
import { inkVar } from "./ink";

/**
 * One whiteboard, framed.
 *
 * The wall does not reflow and neither does this: the board scrolls sideways,
 * because on this artefact the *row* is the datum — a client's name and the bar
 * beside it only mean anything together, and stacking the bars under the names
 * on a narrow screen would destroy exactly the thing being looked at.
 *
 * What does adapt is the left block. Below `md` the three credit columns are
 * dropped and the name is kept, since a phone can show a name and a bar or it
 * can show four fields and no bar. The credits stay editable through the line's
 * own panel, so nothing becomes unreachable — it just stops being on the wall.
 */

/** How wide a column is drawn. A week needs room for "24"; a day only for "M". */
const COLUMN_WIDTH = { week: 46, day: 34 } as const;

export function BoardView({
  board,
  rows,
  today,
  onBoard,
  onAddRow,
  onPatchRow,
  onDeleteRow,
  onMoveRow,
}: {
  board: Board;
  rows: BoardRow[];
  today: string;
  onBoard: (patch: Partial<Board>) => void;
  onAddRow: (section: string, order: number) => void;
  onPatchRow: (rowId: string, patch: Partial<BoardRow>, immediate?: boolean) => void;
  onDeleteRow: (rowId: string) => void;
  onMoveRow: (rowId: string, direction: "up" | "down") => void;
}) {
  const [showRuler, setShowRuler] = React.useState(false);

  const columns = columnsOf(board, CONSOLE_LANG);
  const width = COLUMN_WIDTH[board.scale];

  /** "Mon, 24 Aug" — the same wording the panels and the screen reader get. */
  const columnLabel = React.useCallback(
    (index: number) => shortDate(columns[index]?.iso ?? board.startDate, CONSOLE_LANG),
    [columns, board.startDate]
  );

  /**
   * A bar as a sentence.
   *
   * Colour is the board's notation and a screen reader cannot see it, so the
   * name of the pen is said out loud — otherwise the one distinction the office
   * actually schedules by would be the one thing missing from the spoken board.
   */
  const describe = React.useCallback(
    (row: BoardRow, bar: Bar) =>
      tcf("boardBarAt", {
        label: bar.label || row.label || tc("boardUnnamed"),
        from: columnLabel(bar.start),
        span: tcf(board.scale === "week" ? "boardWeeksN" : "boardDaysN", { n: bar.span }),
      }),
    [board.scale, columnLabel]
  );

  const marker = todayOffset(board, today);

  /*
    The groups to draw, which is not simply `board.sections`.

    A group is deleted from the board document while its rows are deleted one at
    a time, and those two writes are not one transaction — nor are they made by
    the same person, necessarily. Rows whose group has gone would otherwise be
    fetched, held in memory and drawn nowhere: still on the board, invisible.
    They are collected into a group of their own instead, where they can be seen
    and moved somewhere real.
  */
  const declared = new Set(board.sections.map((section) => section.id));
  const strays = [...new Set(rows.filter((row) => !declared.has(row.section)).map((row) => row.section))];

  const groups = [
    ...board.sections,
    ...strays.map((id) => ({ id, title: tc("boardStrays") })),
  ];

  return (
    <section className="flex flex-col gap-3" aria-label={board.title}>
      <header className="no-print flex flex-wrap items-center gap-x-3 gap-y-2">
        <input
          value={board.title}
          aria-label={board.title}
          onChange={(event) => onBoard({ title: event.target.value })}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-lg font-bold tracking-tight outline-none focus:bg-[color:var(--surface)] focus:ring-1 focus:ring-[color:var(--ink-muted)]"
        />

        <button
          type="button"
          aria-expanded={showRuler}
          onClick={() => setShowRuler((open) => !open)}
          className="min-h-9 rounded-lg border border-[color:var(--line)] px-3 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("boardSettings")}
        </button>

        <button
          type="button"
          onClick={() =>
            onBoard({
              sections: [...board.sections, { id: newId("s"), title: "" }],
            })
          }
          className="min-h-9 rounded-lg border border-[color:var(--line)] px-3 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("boardAddGroup")}
        </button>
      </header>

      {showRuler ? (
        <Ruler board={board} columns={columns} columnLabel={columnLabel} onBoard={onBoard} />
      ) : null}

      {/* The frame. The aluminium and the shadow are the whole reason this reads
          as a board on a wall rather than as a table in a dashboard, and it is
          the cheapest signal on the screen: two gradients and no images.

          `data-board-scale` is not decoration: it is what `globals.css` hangs
          `--names` off, so the left block can be one width on a phone and
          another on a desk. Both halves of every row measure against it. */}
      <div
        data-board-scale={board.scale}
        className="rounded-[6px] p-[7px] shadow-[0_20px_44px_-28px_rgba(0,0,0,.6)]"
        style={{ background: "var(--board-frame)" }}
      >
        <div className="board-scroll board-surface overflow-x-auto rounded-[3px] p-3">
          <div style={{ minWidth: `calc(var(--names) + ${columns.length * width}px)` }}>
            <div className="relative">
              {/* The ruler, and the two vertical rules that hang from it. Both are
                  drawn in a layer that starts at the names column, because a
                  percentage inside a padded box resolves against the padding box
                  and the bars measure against the content box — the two would be
                  a few pixels apart all the way down the board. */}
              <div className="pointer-events-none absolute inset-y-0 right-0 left-[var(--names)] z-0">
                {board.markers.map((one) => (
                  <span
                    key={one.id}
                    className="absolute inset-y-0 w-[2px] opacity-80"
                    style={{
                      left: `${(one.column / columns.length) * 100}%`,
                      background: inkVar(one.color),
                    }}
                  >
                    <span className="sr-only">{one.label}</span>
                  </span>
                ))}

                {/*
                  Today, and only when today is actually on this board. The wall
                  in the photograph opens in late August; for most of the year
                  there is no line to draw, and drawing one anyway at column zero
                  is how the previous version of this board taught people to read
                  a public holiday as "now".
                */}
                {marker !== null ? (
                  <span
                    className="absolute inset-y-0 w-[1.5px] bg-[color:var(--ink)] opacity-70"
                    style={{ left: `${marker * 100}%` }}
                  >
                    <span className="sr-only">{tc("boardToday")}</span>
                  </span>
                ) : null}
              </div>

              <div className="relative z-[1] grid [grid-template-columns:var(--names)_minmax(0,1fr)]">
                {/* The wall's own column heads, and the only row on the board
                    that is not editable — they name the fields rather than
                    holding data. */}
                <div className="sticky left-0 flex items-end gap-1 bg-[color:var(--board)] pr-2 pb-1 text-[10px] font-bold tracking-[0.14em] text-[color:var(--marker-red)] uppercase">
                  {board.scale === "week" ? (
                    <>
                      <span className="w-4 shrink-0" aria-hidden="true" />
                      <span className="hidden w-[4.5rem] shrink-0 px-1 md:block">
                        {tc("boardColDLong").slice(0, 1)}
                      </span>
                      <span className="hidden w-8 shrink-0 px-1 md:block">CM</span>
                      <span className="hidden w-8 shrink-0 px-1 md:block">PM</span>
                    </>
                  ) : null}
                  <span className="min-w-0 flex-1 px-1">{tc("boardColClient")}</span>
                </div>
                <ol className="flex list-none">
                  {columns.map((column) => (
                    <li
                      key={column.index}
                      className="figure shrink-0 border-l border-[color:var(--board-rule)] pb-1 pl-1 text-[10px] leading-tight text-[color:var(--marker-ink)]"
                      style={{ width: `${100 / columns.length}%` }}
                    >
                      {column.month ? (
                        <span className="block font-bold tracking-[0.08em] uppercase">
                          {column.month}
                          {column.year ? ` ${column.year}` : ""}
                        </span>
                      ) : null}
                      <span className="block opacity-80">
                        {column.weekday ? `${column.weekday} ` : ""}
                        {column.day}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative z-[1] mt-1 flex flex-col">
                {groups.map((section) => {
                  const lines = rowsOfSection(rows, section.id);

                  return (
                    <div key={section.id} className="mb-3">
                      <div className="sticky left-0 flex w-[var(--names)] items-center gap-1">
                        {declared.has(section.id) ? (
                          <input
                            value={section.title}
                            aria-label={tc("boardGroupTitle")}
                            placeholder={tc("boardGroupTitle")}
                            onChange={(event) =>
                              onBoard({
                                sections: board.sections.map((one) =>
                                  one.id === section.id ? { ...one, title: event.target.value } : one
                                ),
                              })
                            }
                            /* The placeholder is nearly invisible until the field
                               is touched: most groups on the wall have no title at
                               all — they are just a gap — and a column of "GROUP
                               NAME" down the left would be the loudest text on a
                               board whose subject is elsewhere. */
                            className="min-w-0 flex-1 rounded bg-transparent px-1 text-[10px] font-bold tracking-[0.14em] text-[color:var(--marker-ink)] uppercase opacity-70 outline-none placeholder:opacity-20 focus:bg-[color:var(--surface)] focus:opacity-100 focus:placeholder:opacity-60 focus:ring-1 focus:ring-[color:var(--ink-muted)]"
                          />
                        ) : (
                          /* A group that no longer exists has no name to edit —
                             typing here would write into a section the board does
                             not have and quietly do nothing. */
                          <span className="min-w-0 flex-1 px-1 text-[10px] font-bold tracking-[0.14em] text-[color:var(--marker-ink)] uppercase opacity-70">
                            {section.title}
                          </span>
                        )}
                      </div>

                      {lines.map((row, index) => (
                        <RowLine
                          key={row.id}
                          row={row}
                          columns={columns.length}
                          columnLabel={columnLabel}
                          describe={describe}
                          showCredits={board.scale === "week"}
                          first={index === 0}
                          last={index === lines.length - 1}
                          onPatch={(patch, immediate) => onPatchRow(row.id, patch, immediate)}
                          onDelete={() => onDeleteRow(row.id)}
                          onMove={(direction) => onMoveRow(row.id, direction)}
                        />
                      ))}

                      <div className="no-print sticky left-0 flex w-[var(--names)] items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onAddRow(section.id, nextOrder(rows))}
                          className="rounded-md px-1 text-[11px] font-semibold text-[color:var(--marker-ink)] underline decoration-dotted underline-offset-4 opacity-70 transition hover:opacity-100"
                        >
                          + {tc("boardAddRow")}
                        </button>

                        {declared.has(section.id) && board.sections.length > 1 && lines.length === 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onBoard({
                                sections: board.sections.filter((one) => one.id !== section.id),
                              })
                            }
                            className="rounded-md px-1 text-[11px] text-[color:var(--marker-ink)] underline decoration-dotted underline-offset-4 opacity-60 transition hover:opacity-100"
                          >
                            {tc("boardDeleteGroup")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The ruler's own settings, folded away until asked for.
 *
 * Three fields decide what every bar on the board means, so they are not left
 * sitting where a mis-click can reach them — but they are two clicks from the
 * board rather than in a settings page, because "the schedule slipped a week" is
 * a thing that happens on a Monday morning and has to be one edit.
 */
function Ruler({
  board,
  columns,
  columnLabel,
  onBoard,
}: {
  board: Board;
  columns: ReturnType<typeof columnsOf>;
  columnLabel: (index: number) => string;
  onBoard: (patch: Partial<Board>) => void;
}) {
  const startId = React.useId();
  const countId = React.useId();
  const markId = React.useId();

  const [markColumn, setMarkColumn] = React.useState(0);
  const [markLabel, setMarkLabel] = React.useState("");

  return (
    <div className="no-print flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={startId} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {tc("boardStartDate")}
        </label>
        <input
          id={startId}
          type="date"
          value={board.startDate}
          onChange={(event) => onBoard({ startDate: event.target.value })}
          className="min-h-9 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={countId} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {tc("boardColumns")}
        </label>
        <input
          id={countId}
          type="number"
          min={MIN_COLUMNS}
          max={MAX_COLUMNS}
          value={board.columns}
          onChange={(event) => onBoard({ columns: Number(event.target.value) })}
          className="min-h-9 w-24 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm tabular-nums"
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {board.scale === "week" ? tc("boardScaleWeek") : tc("boardScaleDay")}
        </legend>
        <div className="flex items-center gap-2">
          {(["week", "day"] as const).map((scale) => (
            <button
              key={scale}
              type="button"
              aria-pressed={board.scale === scale}
              onClick={() => onBoard({ scale })}
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                board.scale === scale
                  ? "border-[color:var(--ink)] bg-[color:var(--accent-soft)]"
                  : "border-[color:var(--line)] hover:bg-[color:var(--accent-soft)]"
              }`}
            >
              {scale === "week" ? tc("boardScaleWeek") : tc("boardScaleDay")}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-1 flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={markId} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
            {tc("boardAddMarker")}
          </label>
          <div className="flex items-center gap-2">
            <select
              id={markId}
              value={markColumn}
              onChange={(event) => setMarkColumn(Number(event.target.value))}
              className="min-h-9 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm"
            >
              {columns.map((column) => (
                <option key={column.index} value={column.index}>
                  {columnLabel(column.index)}
                </option>
              ))}
            </select>
            <input
              value={markLabel}
              aria-label={tc("boardMarkerLabel")}
              placeholder={tc("boardMarkerLabel")}
              onChange={(event) => setMarkLabel(event.target.value)}
              className="min-h-9 w-40 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm"
            />
            <button
              type="button"
              disabled={markLabel.trim() === ""}
              onClick={() => {
                onBoard({
                  markers: [
                    ...board.markers,
                    { id: newId("m"), column: markColumn, label: markLabel.trim(), color: "orange" },
                  ],
                });
                setMarkLabel("");
              }}
              className="min-h-9 rounded-lg border border-[color:var(--line)] px-3 text-sm font-semibold transition enabled:hover:bg-[color:var(--accent-soft)] disabled:opacity-40"
            >
              {tc("boardAddMarker")}
            </button>
          </div>
        </div>

        {board.markers.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-2">
            {board.markers.map((one) => (
              <li key={one.id}>
                <button
                  type="button"
                  onClick={() =>
                    onBoard({ markers: board.markers.filter((other) => other.id !== one.id) })
                  }
                  className="flex min-h-9 items-center gap-2 rounded-lg border border-[color:var(--line)] px-3 text-sm transition hover:bg-[color:var(--accent-soft)]"
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-[3px] rounded-full"
                    style={{ background: inkVar(one.color) }}
                  />
                  {one.label}
                  <span className="text-[color:var(--ink-muted)]">·</span>
                  <span className="sr-only">{tc("boardMarkerRemove")}</span>
                  <span aria-hidden="true" className="text-[color:var(--ink-muted)]">
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
