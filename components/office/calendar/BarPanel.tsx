"use client";

import React from "react";
import { clampBar, type Bar } from "@/lib/calendarBoard";
import { tc } from "@/lib/i18n";
import { InkSwatches } from "./ink";

/**
 * One bar, opened.
 *
 * It appears in the flow underneath its own line rather than as a popover
 * floating over the board. Three reasons, in order of how much they cost to get
 * wrong: a panel in the flow cannot be clipped by the board's horizontal scroll
 * container, it needs no focus trap to be usable from a keyboard, and on a phone
 * it is simply the next thing down the page instead of a dialog covering the
 * thing being edited.
 *
 * Everything in it is also reachable by dragging — this is the second way, not
 * the only way. It exists because a date typed is a date meant, while a bar
 * dragged is a bar approximately where somebody let go of the mouse.
 */
export function BarPanel({
  bar,
  columns,
  columnLabel,
  onChange,
  onDelete,
  onClose,
}: {
  bar: Bar;
  columns: number;
  /** "Mon 24 Aug" for a column index — the same wording as the ruler above. */
  columnLabel: (index: number) => string;
  onChange: (bar: Bar) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const labelId = React.useId();
  const fromId = React.useId();
  const spanId = React.useId();

  // Columns are counted from one on screen and from zero in the data. The board
  // is read by people who count weeks starting at "the first week".
  const set = (patch: Partial<Bar>) => onChange(clampBar({ ...bar, ...patch }, columns));

  return (
    <div className="mt-1 mb-2 flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-3">
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <label htmlFor={labelId} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {tc("boardBarLabel")}
        </label>
        <input
          id={labelId}
          value={bar.label ?? ""}
          onChange={(event) => onChange({ ...bar, label: event.target.value })}
          className="min-h-9 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {tc("boardBarColor")}
        </span>
        <InkSwatches value={bar.color} label={tc("boardBarColor")} onPick={(color) => set({ color })} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={fromId} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {tc("boardBarFrom")}
        </label>
        <select
          id={fromId}
          value={bar.start}
          onChange={(event) => set({ start: Number(event.target.value) })}
          className="min-h-9 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm"
        >
          {Array.from({ length: columns }, (_, index) => (
            <option key={index} value={index}>
              {columnLabel(index)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={spanId} className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink-muted)] uppercase">
          {tc("boardBarSpan")}
        </label>
        <input
          id={spanId}
          type="number"
          min={1}
          max={columns - bar.start}
          value={bar.span}
          onChange={(event) => set({ span: Number(event.target.value) })}
          className="min-h-9 w-20 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-sm tabular-nums"
        />
      </div>

      <label className="flex min-h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={bar.tentative === true}
          onChange={(event) => onChange({ ...bar, tentative: event.target.checked || undefined })}
          className="h-4 w-4"
        />
        {tc("boardBarTentative")}
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          /* Not painted in `--danger`: that token is the phone's, defined for
             the light theme only, and the console has never used it. The weight
             of the action is carried by the word instead. */
          className="min-h-9 rounded-lg border border-[color:var(--line)] px-3 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("boardBarDelete")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 rounded-lg bg-[color:var(--accent)] px-3 text-sm font-semibold text-[color:var(--accent-contrast)] transition hover:bg-[color:var(--accent-hover)]"
        >
          {tc("boardDone")}
        </button>
      </div>
    </div>
  );
}
