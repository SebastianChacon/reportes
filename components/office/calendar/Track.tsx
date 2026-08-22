"use client";

import React from "react";
import {
  barBox,
  clampBar,
  columnAt,
  drawBar,
  newId,
  resizeBar,
  shiftBar,
  tidyBars,
  type Bar,
  type MarkerColor,
} from "@/lib/calendarBoard";
import { inkVar } from "./ink";

/**
 * One line of the board: the strip a marker is dragged across.
 *
 * Everything a hand can do to a bar happens here, and all of it through pointer
 * events — one code path for mouse, pen and finger, rather than three that drift
 * apart. The arithmetic itself is in `lib/calendarBoard.ts`; this component owns
 * only the gesture: what was grabbed, where it has got to, and whether the
 * person is still holding it.
 *
 * The gesture is deliberately forgiving about which one it is. Pressing on empty
 * board draws; pressing on a bar moves it; pressing within a few pixels of a
 * bar's end stretches it. A press that never moves is a click, and a click means
 * something different in each case — on empty board it drops a one-column bar,
 * on a bar it opens it — because a person who taps a bar wants to see it, and a
 * person who taps an empty week wants a job there.
 */

type Gesture =
  | { kind: "draw"; anchor: number; geometry: { start: number; span: number } }
  | {
      kind: "move" | "resize";
      barId: string;
      origin: Bar;
      anchor: number;
      edge: "start" | "end";
      moved: boolean;
      geometry: { start: number; span: number };
    };

export function Track({
  bars,
  columns,
  color,
  openBar,
  rowLabel,
  describe,
  onBars,
  onOpenBar,
}: {
  bars: Bar[];
  columns: number;
  /** The pen a new bar is drawn with — the row's own, like picking up the pen beside it. */
  color: MarkerColor;
  openBar: string | null;
  rowLabel: string;
  /** Turns a bar into a sentence for the screen reader — see `BoardView`. */
  describe: (bar: Bar) => string;
  onBars: (bars: Bar[]) => void;
  onOpenBar: (barId: string | null) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [gesture, setGesture] = React.useState<Gesture | null>(null);

  function columnFrom(clientX: number): number {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box) return 0;
    return columnAt(clientX - box.left, box.width, columns);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Left button only. A right-click is the browser's menu, and a middle-click
    // on a scrollable board is how some people scroll it.
    if (event.button !== 0) return;

    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-bar-id]");
    const column = columnFrom(event.clientX);

    if (target) {
      const bar = bars.find((candidate) => candidate.id === target.dataset.barId);
      if (!bar) return;
      const edge = (event.target as HTMLElement).dataset.edge as "start" | "end" | undefined;

      setGesture({
        kind: edge ? "resize" : "move",
        barId: bar.id,
        origin: bar,
        anchor: column,
        edge: edge ?? "end",
        moved: false,
        geometry: { start: bar.start, span: bar.span },
      });
    } else {
      setGesture({ kind: "draw", anchor: column, geometry: { start: column, span: 1 } });
    }

    // Capture on the track rather than on the bar: a fast drag leaves the bar
    // behind within the first frame, and without capture the pointer's moves
    // would then be delivered to whatever is under the cursor instead.
    trackRef.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!gesture) return;
    const column = columnFrom(event.clientX);

    if (gesture.kind === "draw") {
      setGesture({ ...gesture, geometry: drawBar(gesture.anchor, column, columns) });
      return;
    }

    const next =
      gesture.kind === "move"
        ? shiftBar(gesture.origin, column - gesture.anchor, columns)
        : resizeBar(gesture.origin, gesture.edge, column, columns);

    setGesture({
      ...gesture,
      moved: gesture.moved || column !== gesture.anchor,
      geometry: { start: next.start, span: next.span },
    });
  }

  function handlePointerUp() {
    if (!gesture) return;
    setGesture(null);

    if (gesture.kind === "draw") {
      const bar: Bar = { id: newId(), color, ...gesture.geometry };
      onBars(tidyBars([...bars, bar], columns));
      // Opened straight away: the person has just made a thing whose colour and
      // label they almost certainly want to set, and hunting for how to open it
      // would be the first thing they had to learn.
      onOpenBar(bar.id);
      return;
    }

    if (!gesture.moved) {
      onOpenBar(openBar === gesture.barId ? null : gesture.barId);
      return;
    }

    onBars(
      tidyBars(
        bars.map((bar) => (bar.id === gesture.barId ? { ...bar, ...gesture.geometry } : bar)),
        columns
      )
    );
  }

  /**
   * The keyboard's version of the same four gestures.
   *
   * Not an afterthought: this console is driven from a keyboard more than from a
   * mouse, and a board that could only be edited by dragging would be a screen
   * some of the office simply could not use.
   */
  function handleKeyDown(event: React.KeyboardEvent, bar: Bar) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      // Shift stretches the far end, plain arrows slide the whole bar — the same
      // two gestures the mouse has, and in the same order of frequency.
      const next = event.shiftKey
        ? clampBar({ ...bar, span: Math.max(1, bar.span + direction) }, columns)
        : shiftBar(bar, direction, columns);
      onBars(tidyBars(bars.map((one) => (one.id === bar.id ? next : one)), columns));
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onBars(bars.filter((one) => one.id !== bar.id));
      onOpenBar(null);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenBar(openBar === bar.id ? null : bar.id);
    }
  }

  const drafted = gesture?.kind === "draw" ? gesture.geometry : null;

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setGesture(null)}
      role="group"
      aria-label={rowLabel}
      /*
        `pan-y` and not `none`: a finger dragging sideways draws, which is the
        point, but a finger dragging up and down still scrolls the page. Taking
        both would trap someone on a phone inside the board.
      */
      className="relative h-[30px] w-full cursor-crosshair touch-pan-y select-none"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, color-mix(in srgb, var(--board-rule) 55%, transparent) 0 1px, transparent 1px ${100 / columns}%)`,
        backgroundSize: `${100 / columns}% 100%`,
      }}
    >
      {bars.map((bar) => {
        const geometry =
          gesture && gesture.kind !== "draw" && gesture.barId === bar.id ? gesture.geometry : bar;
        const box = barBox(geometry, columns);
        const open = openBar === bar.id;

        return (
          <button
            key={bar.id}
            type="button"
            data-bar-id={bar.id}
            aria-label={describe({ ...bar, ...geometry })}
            aria-expanded={open}
            onKeyDown={(event) => handleKeyDown(event, bar)}
            className={`board-bar absolute top-1/2 flex h-[15px] -translate-y-1/2 cursor-grab items-center overflow-hidden rounded-full px-1 text-[10px] leading-none font-semibold tracking-[0.04em] uppercase active:cursor-grabbing ${
              open ? "ring-2 ring-[color:var(--ink)] ring-offset-1 ring-offset-[color:var(--board)]" : ""
            } ${bar.tentative ? "board-bar-tentative" : ""}`}
            style={{
              ...box,
              // A dashed bar is drawn by the stripe image in `globals.css`, which
              // paints in `currentColor`; a solid one is a fill. Setting both
              // would show the stripes over a solid block.
              ...(bar.tentative
                ? { color: inkVar(bar.color) }
                : { background: inkVar(bar.color), color: "var(--board)" }),
            }}
          >
            {bar.label ? <span className="truncate">{bar.label}</span> : null}

            {/* The two grab zones. `data-edge` is what the pointer handler
                reads. 14px, which is a third of a week column: measured against
                a 10px version that was genuinely hard to hit — a miss there does
                not do nothing, it *moves* the bar, which is the worst way for a
                target to be too small. */}
            <span
              aria-hidden="true"
              data-edge="start"
              className="absolute inset-y-0 left-0 w-[14px] cursor-ew-resize"
            />
            <span
              aria-hidden="true"
              data-edge="end"
              className="absolute inset-y-0 right-0 w-[14px] cursor-ew-resize"
            />
          </button>
        );
      })}

      {/* The stroke being drawn right now. Not in state anywhere — it becomes a
          real bar on pointer-up, or it never existed. */}
      {drafted ? (
        <span
          aria-hidden="true"
          className="board-bar pointer-events-none absolute top-1/2 h-[15px] -translate-y-1/2 rounded-full opacity-70"
          style={{ ...barBox(drafted, columns), background: inkVar(color) }}
        />
      ) : null}
    </div>
  );
}
