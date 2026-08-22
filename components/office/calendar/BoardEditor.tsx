"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ORDER_STEP,
  reorderRow,
  sortRows,
  type Board,
  type BoardRow,
} from "@/lib/calendarBoard";
import { sendEdit, type BoardEdit } from "@/lib/calendarApi";
import { todayForOffice } from "@/lib/officeDate";
import { tc } from "@/lib/i18n";
import { BoardView } from "./BoardView";

/**
 * The board, and everything that keeps it saved.
 *
 * The screen is optimistic from end to end: an edit lands on the screen first
 * and goes to the server behind it. That is not a performance trick, it is what
 * makes the thing usable — a bar being dragged cannot wait for a round trip per
 * frame, and a name being typed cannot wait for one per keystroke.
 *
 * Which means the interesting question here is not "how do we save" but "what
 * happens when a save does not land", and the answer is deliberately blunt:
 *
 * - **The change stays on the screen.** It is not rolled back. The person is
 *   looking at what they meant; taking it away would lose work that they can
 *   still see and would leave them nothing to retry.
 * - **The banner says so, and offers the retry.** Every failed edit is kept and
 *   re-sent in order, because they are not independent — a bar moved twice must
 *   not be saved in the older position.
 * - **Nothing refreshes underneath an unsaved board.** The reload that picks up
 *   somebody else's edits is held back while anything of yours is in flight,
 *   which is the one case where "last write wins" would throw away the wrong
 *   write.
 */

/** How long a keystroke waits before it becomes a request. */
const SETTLE_MS = 600;

type Props = {
  boards: Board[];
  rows: BoardRow[];
  truncated: boolean;
};

export function BoardEditor({ boards: initialBoards, rows: initialRows, truncated }: Props) {
  const router = useRouter();

  const [boards, setBoards] = React.useState(initialBoards);
  const [rows, setRows] = React.useState(initialRows);
  const [inFlight, setInFlight] = React.useState(0);
  const [failures, setFailures] = React.useState<BoardEdit[]>([]);
  const [seeding, setSeeding] = React.useState(false);

  /*
    A mirror of the state, kept in step *synchronously*.

    Two different needs, and only one of them is obvious. The debounce is the
    obvious one: when the timer fires a second later it must send the last letter
    typed, not the letter that was current when the timer was set.

    The other one is what actually bit during testing. An immediate save — a bar
    let go of — runs in the same tick as its `setRows`, and React has not
    re-rendered yet, so a ref assigned during render still holds the state from
    *before* the drag. The bar was drawn on screen, the request went out with the
    old bars, and the board silently un-drew itself on the next reload. So every
    edit writes through `apply` below, which updates the mirror first and the
    state after.
  */
  const latest = React.useRef({ boards, rows });

  /** The one way state changes here — mirror first, so a save in the same tick sees it. */
  const apply = React.useCallback(
    (change: (current: { boards: Board[]; rows: BoardRow[] }) => { boards: Board[]; rows: BoardRow[] }) => {
      const next = change(latest.current);
      latest.current = next;
      setBoards(next.boards);
      setRows(next.rows);
    },
    []
  );

  /** Key → the waiting timer and the write it will make, so it can be flushed early. */
  const timers = React.useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; fire: () => void }>());

  const send = React.useCallback(async (edit: BoardEdit) => {
    setInFlight((count) => count + 1);
    const result = await sendEdit(edit);
    setInFlight((count) => count - 1);

    if (!result.ok) setFailures((queue) => [...queue, edit]);
    return result;
  }, []);

  /** Coalesces everything typed into one field into a single write. */
  const schedule = React.useCallback(
    (key: string, build: () => BoardEdit | null, immediate = false) => {
      const running = timers.current.get(key);
      if (running) clearTimeout(running.timer);

      const fire = () => {
        timers.current.delete(key);
        const edit = build();
        if (edit) void send(edit);
      };

      if (immediate) {
        fire();
        return;
      }
      timers.current.set(key, { timer: setTimeout(fire, SETTLE_MS), fire });
    },
    [send]
  );

  /*
    A link followed with a name half-typed. The waiting writes are *sent*, not
    cancelled: six hundred milliseconds is easily short enough to feel instant
    and easily long enough to lose a client's name to a click on "The day".

    `pagehide` covers the other exit — the tab being closed or navigated away
    from — where React never unmounts anything.
  */
  React.useEffect(() => {
    const pending = timers.current;

    const flush = () => {
      for (const { timer, fire } of [...pending.values()]) {
        clearTimeout(timer);
        fire();
      }
    };

    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  /*
    Somebody else's edits. The server component re-reads Convex on `refresh`, and
    the new props arrive here — but only adopted when this screen has nothing of
    its own outstanding, or a refresh landing mid-drag would yank the bar back.
  */
  const settled = inFlight === 0 && failures.length === 0 && timers.current.size === 0;
  const signature = React.useMemo(
    () => JSON.stringify([initialBoards, initialRows]),
    [initialBoards, initialRows]
  );

  React.useEffect(() => {
    if (!settled) return;
    apply(() => ({ boards: initialBoards, rows: initialRows }));
    // `signature` is the dependency that matters: it changes only when the
    // server actually sent something different.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  React.useEffect(() => {
    const onFocus = () => {
      if (inFlight === 0 && failures.length === 0 && timers.current.size === 0) router.refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router, inFlight, failures.length]);

  /* ---------------------------------------------------------------- */
  /* The edits                                                         */
  /* ---------------------------------------------------------------- */

  function patchBoard(key: string, patch: Partial<Board>) {
    apply((current) => ({
      ...current,
      boards: current.boards.map((board) => (board.key === key ? { ...board, ...patch } : board)),
    }));

    schedule(`board:${key}`, () => {
      const board = latest.current.boards.find((one) => one.key === key);
      if (!board) return null;
      return {
        action: "board",
        key,
        title: board.title,
        scale: board.scale,
        startDate: board.startDate,
        columns: board.columns,
        markers: board.markers,
        sections: board.sections,
      };
    });
  }

  function patchRow(rowId: string, patch: Partial<BoardRow>, immediate = false) {
    apply((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));

    schedule(
      `row:${rowId}`,
      () => {
        const row = latest.current.rows.find((one) => one.id === rowId);
        if (!row) return null;
        return {
          action: "updateRow",
          rowId,
          label: row.label,
          // Sent as empty strings rather than omitted: the route reads `undefined`
          // as "leave it alone", and a cleared field has to reach the mutation as
          // something in order to be cleared.
          d: row.d ?? "",
          cm: row.cm ?? "",
          pm: row.pm ?? "",
          note: row.note ?? "",
          color: row.color,
          bars: row.bars,
        };
      },
      immediate
    );
  }

  async function addRow(boardKey: string, section: string, order: number) {
    const result = await send({ action: "addRow", boardKey, section, order, color: "ink" });
    if (!result.ok || !result.rowId) return;

    // Appended with the id the server gave it, rather than refreshing the page:
    // a refresh would scroll the board back to the left and lose the place of
    // whoever is halfway down it.
    apply((current) => ({
      ...current,
      rows: [
        ...current.rows,
        {
          id: result.rowId as string,
          boardKey,
          section,
          order,
          label: "",
          color: "ink",
          bars: [],
        },
      ],
    }));
  }

  function deleteRow(rowId: string) {
    apply((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== rowId) }));
    void send({ action: "deleteRow", rowId });
  }

  function moveRow(boardKey: string, rowId: string, direction: "up" | "down") {
    // Only this board's rows are handed to the reorder: two boards share the
    // same run of numbers, and a row moved against the other board's orders
    // would land in a gap that belongs to nobody.
    const orders = reorderRow(
      latest.current.rows.filter((row) => row.boardKey === boardKey),
      rowId,
      direction
    );
    if (orders.length === 0) return;

    const byId = new Map(orders.map((entry) => [entry.id, entry.order]));
    apply((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        byId.has(row.id) ? { ...row, order: byId.get(row.id)! } : row
      ),
    }));
    void send({
      action: "reorder",
      orders: orders.map((entry) => ({ rowId: entry.id, order: entry.order })),
    });
  }

  async function seed() {
    setSeeding(true);
    const result = await send({ action: "seed" });
    setSeeding(false);
    if (result.ok) router.refresh();
  }

  async function startBlank() {
    const key = "production";
    await send({
      action: "board",
      key,
      title: tc("boardTitle"),
      scale: "week",
      startDate: todayForOffice(),
      columns: 20,
      sections: [{ id: "main", title: "" }],
    });
    await send({ action: "addRow", boardKey: key, section: "main", order: ORDER_STEP });
    router.refresh();
  }

  async function retry() {
    const queue = failures;
    setFailures([]);
    for (const edit of queue) {
      const result = await send(edit);
      // Stop at the first one that fails again: the rest are behind it in time
      // and sending them now would apply the newer edits before the older.
      if (!result.ok) break;
    }
  }

  /* ---------------------------------------------------------------- */

  if (rows.length === 0 && !seeding) {
    return (
      <div className="flex flex-col gap-4">
        <Intro />
        <div className="card flex flex-col gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5">
          <h2 className="text-base font-bold">{tc("boardEmpty")}</h2>
          <p className="max-w-prose text-sm text-[color:var(--ink-muted)]">{tc("boardEmptyHint")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void seed()}
              className="min-h-11 rounded-xl bg-[color:var(--accent)] px-4 text-[15px] font-semibold text-[color:var(--accent-contrast)] transition hover:bg-[color:var(--accent-hover)]"
            >
              {tc("boardSeed")}
            </button>
            <button
              type="button"
              onClick={() => void startBlank()}
              className="min-h-11 rounded-xl border-[1.5px] border-[color:var(--line)] px-4 text-[15px] font-semibold transition hover:bg-[color:var(--accent-soft)]"
            >
              {tc("boardStartBlank")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const today = todayForOffice();

  return (
    <div className="flex flex-col gap-6">
      <Intro />

      <div className="no-print flex items-center gap-3 text-sm text-[color:var(--ink-muted)]" aria-live="polite">
        {failures.length > 0 ? (
          <>
            <span>{tc("boardSaveFailed")}</span>
            <button
              type="button"
              onClick={() => void retry()}
              className="min-h-9 rounded-lg border border-[color:var(--line)] px-3 font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--accent-soft)]"
            >
              {tc("boardRetry")}
            </button>
          </>
        ) : inFlight > 0 ? (
          <span>{tc("boardSaving")}</span>
        ) : (
          <span>{tc("boardSaved")}</span>
        )}

        <button
          type="button"
          onClick={() => router.refresh()}
          className="ml-auto min-h-9 rounded-lg border border-[color:var(--line)] px-3 font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("boardRefresh")}
        </button>
      </div>

      {truncated ? (
        <p className="notice text-sm">{tc("boardTruncated")}</p>
      ) : null}

      {boards.map((board) => (
        <BoardView
          key={board.key}
          board={board}
          rows={sortRows(rows.filter((row) => row.boardKey === board.key))}
          today={today}
          onBoard={(patch) => patchBoard(board.key, patch)}
          onAddRow={(section, order) => void addRow(board.key, section, order)}
          onPatchRow={patchRow}
          onDeleteRow={deleteRow}
          onMoveRow={(rowId, direction) => moveRow(board.key, rowId, direction)}
        />
      ))}
    </div>
  );
}

function Intro() {
  return (
    <div className="no-print flex flex-col gap-1">
      <p className="max-w-prose text-sm text-[color:var(--ink-muted)]">{tc("boardLead")}</p>
      <p className="max-w-prose text-xs text-[color:var(--ink-muted)]">{tc("boardKeys")}</p>
    </div>
  );
}
