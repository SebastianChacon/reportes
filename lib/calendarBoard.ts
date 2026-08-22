import { shiftDate } from "./officeDate";

/**
 * The geometry of the production board, with nothing that touches a screen.
 *
 * The whiteboard on the office wall is a grid: a name on the left, and a bar
 * drawn across some run of columns on the right. Everything that can actually
 * go wrong here is arithmetic — a bar that starts before the ruler, a drag that
 * ends left of where it began, a row moved past the end of its group — so all of
 * it lives in this module, where it can be tested without a pointer, and the
 * components are left with nothing but painting.
 *
 * Two rules hold throughout:
 *
 * 1. **Every function is total.** A bar that arrives outside the ruler is
 *    clipped, not rejected. The board is edited by hand and shared between
 *    people; shortening the timeline while somebody else is drawing at the far
 *    end must not produce a page that throws.
 * 2. **Columns are indices, not dates.** The ruler's start and scale live on the
 *    board, so a board can be dragged forward a week by changing one field
 *    rather than by rewriting every bar on it.
 */

export const MARKER_COLORS = ["red", "green", "blue", "orange", "ink"] as const;
export type MarkerColor = (typeof MARKER_COLORS)[number];

export function isMarkerColor(value: unknown): value is MarkerColor {
  return typeof value === "string" && (MARKER_COLORS as readonly string[]).includes(value);
}

/** Weeks for the production wall, days for the Enhancements panel beside it. */
export const SCALES = ["week", "day"] as const;
export type Scale = (typeof SCALES)[number];

export function isScale(value: unknown): value is Scale {
  return typeof value === "string" && (SCALES as readonly string[]).includes(value);
}

/**
 * One stroke of marker: where it starts, how many columns it covers.
 *
 * `id` is generated on the client and kept for the life of the stroke. React
 * needs a stable key for something that is dragged, and an index would make the
 * bar being resized swap identity with its neighbour the moment they cross.
 */
export type Bar = {
  id: string;
  start: number;
  span: number;
  color: MarkerColor;
  /** Written inside the bar — the crew lanes name the job there. */
  label?: string;
  /** Dashed, which is how the wall says "probably, not yet". */
  tentative?: boolean;
};

export type BoardRow = {
  id: string;
  /** Which wall it hangs on. Rows of every board arrive in one list. */
  boardKey: string;
  section: string;
  order: number;
  label: string;
  /** Designer, construction manager, project manager — the three left columns. */
  d?: string;
  cm?: string;
  pm?: string;
  /** The line in smaller hand under the name — "on hold", the crew's clients. */
  note?: string;
  color: MarkerColor;
  bars: Bar[];
};

/** The orange rule taped down the wall on Labor Day, and anything like it. */
export type BoardMarker = { id: string; column: number; label: string; color: MarkerColor };

/** A block of rows with a gap above it, exactly as the wall groups them. */
export type BoardSection = { id: string; title: string };

export type Board = {
  key: string;
  title: string;
  scale: Scale;
  /** ISO date of column 0. A Monday, for a weekly board. */
  startDate: string;
  columns: number;
  markers: BoardMarker[];
  sections: BoardSection[];
};

/**
 * How far the ruler may be stretched.
 *
 * Not a storage limit — it is that the board is read by walking along it, and
 * two years of columns at a legible width is a page nobody can read. The floor
 * of one exists so a mistyped `0` cannot produce a division by zero downstream.
 */
export const MIN_COLUMNS = 1;
export const MAX_COLUMNS = 104;

export const MAX_LABEL = 60;

/** Days each column covers, which is the only place the two scales differ. */
export function columnDays(scale: Scale): number {
  return scale === "week" ? 7 : 1;
}

export function columnDate(board: Pick<Board, "startDate" | "scale">, index: number): string {
  return shiftDate(board.startDate, index * columnDays(board.scale));
}

const MONTHS: Record<string, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
};

const WEEKDAYS: Record<string, string[]> = {
  en: ["S", "M", "T", "W", "T", "F", "S"],
  es: ["D", "L", "M", "M", "J", "V", "S"],
};

export type Column = {
  index: number;
  iso: string;
  /** The number under the ruler: day of the month. */
  day: number;
  /** Set only on the first column of a month — the wall labels it there and nowhere else. */
  month: string | null;
  /** Set only when the month it opens is January, because that is when the year changed. */
  year: number | null;
  /** Empty on a weekly board; the weekday initial on a daily one. */
  weekday: string;
  weekend: boolean;
};

/**
 * The ruler across the top, worked out from the start date and the scale.
 *
 * Dates are read back off the ISO string rather than off a `Date`: everything
 * here is a calendar day, and building a `Date` to ask which month it is in
 * reintroduces the timezone question `lib/officeDate.ts` exists to close.
 */
export function columnsOf(board: Pick<Board, "startDate" | "scale" | "columns">, lang = "en"): Column[] {
  const total = clampColumns(board.columns);
  const months = MONTHS[lang] ?? MONTHS.en;
  const weekdays = WEEKDAYS[lang] ?? WEEKDAYS.en;

  let previousMonth = -1;

  return Array.from({ length: total }, (_, index) => {
    const iso = columnDate(board, index);
    const [year, month, day] = iso.split("-").map(Number);
    const opensMonth = month !== previousMonth;
    previousMonth = month;

    // `Date.UTC` and not `new Date(iso)`: the weekday of a calendar day must not
    // depend on the reader's offset, or a Monday board reads as Sunday in half
    // the world.
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    return {
      index,
      iso,
      day,
      month: opensMonth ? (months[month - 1] ?? "") : null,
      year: opensMonth && month === 1 ? year : null,
      weekday: board.scale === "day" ? (weekdays[weekday] ?? "") : "",
      weekend: weekday === 0 || weekday === 6,
    };
  });
}

export function clampColumns(count: number): number {
  if (!Number.isFinite(count)) return MIN_COLUMNS;
  return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.round(count)));
}

/** Which column a point falls in, given the track's box. Always in range. */
export function columnAt(offsetX: number, width: number, columns: number): number {
  const total = clampColumns(columns);
  if (width <= 0) return 0;
  const raw = Math.floor((offsetX / width) * total);
  return Math.max(0, Math.min(total - 1, raw));
}

/**
 * A bar clipped to the ruler.
 *
 * Two separate failures land here and both have to survive: a bar drawn on a
 * board that was later shortened, and a bar whose numbers were hand-edited. The
 * span floor is one column, because a bar of zero width is invisible and
 * therefore impossible to grab back.
 */
export function clampBar<T extends Pick<Bar, "start" | "span">>(bar: T, columns: number): T {
  const total = clampColumns(columns);
  const start = Math.max(0, Math.min(Math.round(bar.start), total - 1));
  const span = Math.max(1, Math.min(Math.round(bar.span), total - start));
  return { ...bar, start, span };
}

/**
 * The stroke made by dragging from one column to another.
 *
 * Direction is not preserved on purpose: drawing right-to-left is how a
 * left-handed person marks a wall, and it should leave the same bar behind.
 */
export function drawBar(anchor: number, head: number, columns: number): { start: number; span: number } {
  const total = clampColumns(columns);
  const from = Math.max(0, Math.min(anchor, head, total - 1));
  const to = Math.max(0, Math.min(Math.max(anchor, head), total - 1));
  return { start: from, span: to - from + 1 };
}

/** Slide a whole bar sideways, keeping its length. It stops at the ends. */
export function shiftBar(bar: Bar, delta: number, columns: number): Bar {
  const total = clampColumns(columns);
  const span = Math.max(1, Math.min(bar.span, total));
  const start = Math.max(0, Math.min(bar.start + Math.round(delta), total - span));
  return { ...bar, start, span };
}

/**
 * Drag one end of a bar to a column.
 *
 * The dragged edge may pass the other one — that is what a hand does — so the
 * bar flips rather than collapsing, and the caller carries on dragging what is
 * now the opposite edge.
 */
export function resizeBar(bar: Bar, edge: "start" | "end", column: number, columns: number): Bar {
  const total = clampColumns(columns);
  const at = Math.max(0, Math.min(Math.round(column), total - 1));
  const fixed = edge === "start" ? bar.start + bar.span - 1 : bar.start;
  return { ...bar, ...drawBar(fixed, at, total) };
}

/** Every bar of a row, clipped and sorted, which is the order the board reads in. */
export function tidyBars(bars: Bar[], columns: number): Bar[] {
  return bars.map((bar) => clampBar(bar, columns)).sort((a, b) => a.start - b.start || a.span - b.span);
}

/* ------------------------------------------------------------------ */
/* Rows and their order                                                */
/* ------------------------------------------------------------------ */

/**
 * Rows are ordered by a number rather than by their position in an array
 * because they arrive from an indexed read, and two people editing the same
 * board must not be able to reorder it by both appending.
 */
export const ORDER_STEP = 100;

export function nextOrder(rows: Pick<BoardRow, "order">[]): number {
  return rows.reduce((highest, row) => Math.max(highest, row.order), 0) + ORDER_STEP;
}

export function sortRows<T extends Pick<BoardRow, "order" | "id">>(rows: T[]): T[] {
  // The id breaks ties so that a board whose orders collided — two clients
  // appended at once — still renders in the same sequence for everybody.
  return [...rows].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function rowsOfSection<T extends Pick<BoardRow, "order" | "id" | "section">>(
  rows: T[],
  section: string
): T[] {
  return sortRows(rows.filter((row) => row.section === section));
}

/**
 * Move a row one place within its own section.
 *
 * Returns the whole board's order list rather than the two rows that swapped:
 * it is a handful of numbers, one write, and it repairs any collision that was
 * already there — which a swap would preserve forever.
 *
 * An empty array means the move was refused (top row moved up, unknown id), and
 * the caller is expected to do nothing rather than to save an unchanged board.
 */
export function reorderRow<T extends Pick<BoardRow, "id" | "order" | "section">>(
  rows: T[],
  id: string,
  direction: "up" | "down"
): { id: string; order: number }[] {
  const target = rows.find((row) => row.id === id);
  if (!target) return [];

  const siblings = rowsOfSection(rows, target.section);
  const at = siblings.findIndex((row) => row.id === id);
  const to = direction === "up" ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= siblings.length) return [];

  const moved = [...siblings];
  [moved[at], moved[to]] = [moved[to], moved[at]];

  /*
    The section's own numbers are reused, in order, for whoever now occupies
    each place. Handing out fresh numbers instead would work for this section
    and quietly move it past the one below, because the sections share a single
    sequence — the gap between two groups on the wall is nothing but a run of
    orders that no row holds.

    Two rows that already shared a number get separated here, since the slots
    are taken in sorted order and each is used once.
  */
  const slots = siblings.map((row) => row.order).sort((a, b) => a - b);
  let previous = -Infinity;

  return moved.map((row, index) => {
    // Duplicated orders would leave two rows tied again; each slot is pushed
    // past the one before it so the sequence is strictly increasing.
    const order = Math.max(slots[index] ?? previous + ORDER_STEP, previous + 1);
    previous = order;
    return { id: row.id, order };
  });
}

/**
 * Renumber a whole board from scratch — used when a section is added or a row
 * lands between two neighbours that share an order.
 */
export function renumber<T extends Pick<BoardRow, "id" | "order" | "section">>(
  rows: T[],
  sections: BoardSection[]
): { id: string; order: number }[] {
  let next = 0;
  return sections.flatMap((section) =>
    rowsOfSection(rows, section.id).map((row) => ({ id: row.id, order: (next += ORDER_STEP) }))
  );
}

/* ------------------------------------------------------------------ */
/* Bits of hygiene shared by the client, the route and the mutations   */
/* ------------------------------------------------------------------ */

/** Trimmed, capped, and never a lone run of spaces pretending to be a name. */
export function tidyLabel(raw: unknown, max = MAX_LABEL): string {
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

/**
 * A short unique id for a bar, a marker or a section.
 *
 * `crypto.randomUUID` where it exists — every browser this console supports and
 * every Node it runs on — with a fallback so a test environment without the
 * global does not take the editor down with it.
 */
export function newId(prefix = "b"): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}

/** Where a bar sits, as CSS percentages of the ruler. */
export function barBox(bar: Pick<Bar, "start" | "span">, columns: number) {
  const total = clampColumns(columns);
  const fitted = clampBar(bar, total);
  return {
    left: `${(fitted.start / total) * 100}%`,
    width: `${(fitted.span / total) * 100}%`,
  };
}

/**
 * Which column today falls in, or null when today is off the board.
 *
 * Null is a real answer and the caller must draw nothing for it: the wall in the
 * photograph opens in late August, and for most of the year "today" is simply
 * not on it. The previous version of this board drew the marker anyway and
 * people read the Labor Day rule as today.
 */
export function todayColumn(
  board: Pick<Board, "startDate" | "scale" | "columns">,
  today: string
): number | null {
  const total = clampColumns(board.columns);
  const days = daysBetween(board.startDate, today);
  if (days === null || days < 0) return null;
  const column = Math.floor(days / columnDays(board.scale));
  return column < total ? column : null;
}

/** Whole days from one calendar day to another, or null if either is not a day. */
export function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

/** How far along its column today is, 0–1 — the marker sits there, not on the edge. */
export function todayOffset(
  board: Pick<Board, "startDate" | "scale" | "columns">,
  today: string
): number | null {
  const column = todayColumn(board, today);
  if (column === null) return null;
  const days = daysBetween(board.startDate, today) ?? 0;
  const within = days - column * columnDays(board.scale);
  return (column + within / columnDays(board.scale)) / clampColumns(board.columns);
}
