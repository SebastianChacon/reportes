"use client";

import React from "react";
import { newId, tidyBars, type Bar, type BoardRow, type MarkerColor } from "@/lib/calendarBoard";
import { tc } from "@/lib/i18n";
import { BarPanel } from "./BarPanel";
import { InkSwatches, inkVar } from "./ink";
import { Track } from "./Track";

/**
 * One client, one crew, one line of the wall.
 *
 * The name and the three credit columns are plain inputs, always live — there is
 * no "edit" mode to enter and no pencil to find. That is the whole bet of this
 * screen: the board on the wall is edited by walking up to it with a pen, and
 * the moment a screen asks somebody to unlock a field first, they go back to the
 * wall.
 *
 * What it costs is a save on every keystroke, which is why the parent debounces
 * text and writes structure immediately — see `BoardEditor`.
 */

const cellClass =
  "min-w-0 rounded-md bg-transparent px-1 py-0.5 text-[13px] outline-none transition focus:bg-[color:var(--surface)] focus:ring-1 focus:ring-[color:var(--ink-muted)]";

export function RowLine({
  row,
  columns,
  columnLabel,
  describe,
  showCredits,
  first,
  last,
  onPatch,
  onDelete,
  onMove,
}: {
  row: BoardRow;
  columns: number;
  columnLabel: (index: number) => string;
  describe: (row: BoardRow, bar: Bar) => string;
  showCredits: boolean;
  first: boolean;
  last: boolean;
  onPatch: (patch: Partial<BoardRow>, immediate?: boolean) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const [openBar, setOpenBar] = React.useState<string | null>(null);
  const [openRow, setOpenRow] = React.useState(false);

  const bar = row.bars.find((candidate) => candidate.id === openBar) ?? null;

  function setBars(bars: Bar[]) {
    onPatch({ bars }, true);
  }

  function addBar() {
    const fresh: Bar = { id: newId(), start: 0, span: 1, color: row.color };
    setBars(tidyBars([...row.bars, fresh], columns));
    setOpenBar(fresh.id);
  }

  return (
    <div data-row-id={row.id}>
      <div className="grid items-center gap-2 [grid-template-columns:var(--names)_minmax(0,1fr)]">
        {/* The sticky half. It has to be sticky rather than outside the scroll
            container: the two halves share a row height, and two boxes that
            scroll separately drift apart by a pixel per row until the name no
            longer belongs to the bar beside it. */}
        <div className="sticky left-0 z-10 flex items-center gap-1 bg-[color:var(--board)] pr-2">
          <button
            type="button"
            aria-expanded={openRow}
            aria-label={`${tc("boardRowMenu")} — ${row.label || tc("boardUnnamed")}`}
            onClick={() => setOpenRow((open) => !open)}
            className="grid h-6 w-4 shrink-0 place-items-center rounded text-[color:var(--ink-muted)] transition hover:text-[color:var(--ink)]"
          >
            <span aria-hidden="true" className="h-3 w-[3px] rounded-full" style={{ background: inkVar(row.color) }} />
          </button>

          {showCredits ? (
            <div className="hidden shrink-0 items-center gap-1 md:flex">
              <input
                value={row.d ?? ""}
                aria-label={tc("boardColDLong")}
                onChange={(event) => onPatch({ d: event.target.value })}
                className={`${cellClass} w-[4.5rem] text-[10px] text-[color:var(--ink-muted)]`}
              />
              <input
                value={row.cm ?? ""}
                aria-label={tc("boardColCmLong")}
                onChange={(event) => onPatch({ cm: event.target.value })}
                className={`${cellClass} w-8 text-[11px]`}
              />
              <input
                value={row.pm ?? ""}
                aria-label={tc("boardColPmLong")}
                onChange={(event) => onPatch({ pm: event.target.value })}
                className={`${cellClass} w-8 text-[11px]`}
              />
            </div>
          ) : null}

          {/* The client last, hard against the track, because that is the pair
              the board is read in: a name and the bar beside it. It is also the
              order the wall itself is written in — D, CM, PM, then who it is
              for. */}
          <input
            value={row.label}
            aria-label={tc("boardColClient")}
            placeholder={tc("boardUnnamed")}
            onChange={(event) => onPatch({ label: event.target.value })}
            className={`${cellClass} min-w-0 flex-1 font-semibold tracking-[0.02em] uppercase`}
            style={{ color: inkVar(row.color) }}
          />
        </div>

        <Track
          bars={row.bars}
          columns={columns}
          color={row.color}
          openBar={openBar}
          rowLabel={row.label || tc("boardUnnamed")}
          describe={(one) => describe(row, one)}
          onBars={setBars}
          onOpenBar={setOpenBar}
        />
      </div>

      {/* The note rides under the name, out of the grid, because it is the only
          thing on the line that is allowed to be long. */}
      {row.note && !openRow ? (
        <p className="sticky left-0 max-w-[var(--names)] truncate pl-6 text-[10px] text-[color:var(--ink-muted)]">
          {row.note}
        </p>
      ) : null}

      {bar ? (
        <div className="sticky left-0 w-[min(46rem,100%)]">
          <BarPanel
            bar={bar}
            columns={columns}
            columnLabel={columnLabel}
            onChange={(next) =>
              setBars(row.bars.map((one) => (one.id === next.id ? next : one)))
            }
            onDelete={() => {
              setBars(row.bars.filter((one) => one.id !== bar.id));
              setOpenBar(null);
            }}
            onClose={() => setOpenBar(null)}
          />
        </div>
      ) : null}

      {openRow ? (
        <div className="sticky left-0 mt-1 mb-2 flex w-[min(46rem,100%)] flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-3">
          <Field label={tc("boardColClient")} value={row.label} onChange={(label) => onPatch({ label })} wide />
          {showCredits ? (
            <>
              <Field label={tc("boardColDLong")} value={row.d ?? ""} onChange={(d) => onPatch({ d })} />
              <Field label={tc("boardColCmLong")} value={row.cm ?? ""} onChange={(cm) => onPatch({ cm })} />
              <Field label={tc("boardColPmLong")} value={row.pm ?? ""} onChange={(pm) => onPatch({ pm })} />
            </>
          ) : null}
          <Field label={tc("boardNote")} value={row.note ?? ""} onChange={(note) => onPatch({ note })} wide />

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
              {tc("boardBarColor")}
            </span>
            <InkSwatches
              value={row.color}
              label={tc("boardBarColor")}
              onPick={(color: MarkerColor) => onPatch({ color }, true)}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Minor onClick={addBar}>{tc("boardAddBar")}</Minor>
            <Minor onClick={() => onMove("up")} disabled={first}>
              {tc("boardMoveUp")}
            </Minor>
            <Minor onClick={() => onMove("down")} disabled={last}>
              {tc("boardMoveDown")}
            </Minor>
            <Minor
              onClick={() => {
                // The one confirmation on this screen. Everything else that can
                // be done wrong here can be dragged back; a line that is gone
                // takes its bars with it and there is no undo.
                if (window.confirm(tc("boardDeleteRowSure"))) onDelete();
              }}
            >
              {tc("boardDeleteRow")}
            </Minor>
            <button
              type="button"
              onClick={() => setOpenRow(false)}
              className="min-h-9 rounded-lg bg-[color:var(--accent)] px-3 text-sm font-semibold text-[color:var(--accent-contrast)] transition hover:bg-[color:var(--accent-hover)]"
            >
              {tc("boardDone")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  const id = React.useId();

  return (
    <div className={`flex flex-col gap-1 ${wide ? "min-w-[10rem] flex-1" : ""}`}>
      <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-9 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm ${wide ? "" : "w-24"}`}
      />
    </div>
  );
}

function Minor({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-9 rounded-lg border border-[color:var(--line)] px-3 text-sm font-semibold transition enabled:hover:bg-[color:var(--accent-soft)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
