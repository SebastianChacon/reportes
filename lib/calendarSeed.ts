import { ORDER_STEP, type Bar, type MarkerColor } from "./calendarBoard";

/**
 * The wall as it stood in the photograph, ready to be written into an empty
 * board.
 *
 * This is a **starting point, not the schedule**. Nothing reads it after the
 * board has been filled: the office edits the board, the board is the record,
 * and this file stays exactly as it is. It exists so that the first person to
 * open the screen is not asked to retype twenty-three clients before seeing
 * whether the thing works.
 *
 * The spans were transcribed by eye from a photograph with glare across half
 * the whiteboard, so they carry the right shape and approximate dates. That is
 * the other reason this is only a seed — every one of them is expected to be
 * dragged into place, which is the entire point of the screen.
 */

type SeedBar = { start: number; span: number; color?: MarkerColor; label?: string; tentative?: boolean };

type SeedRow = {
  label: string;
  d?: string;
  cm?: string;
  pm?: string;
  note?: string;
  color: MarkerColor;
  bars?: SeedBar[];
};

type SeedSection = { id: string; title: string; rows: SeedRow[] };

type SeedBoard = {
  key: string;
  title: string;
  scale: "week" | "day";
  startDate: string;
  columns: number;
  markers: { column: number; label: string; color: MarkerColor }[];
  sections: SeedSection[];
};

/** Monday 24 August 2026 — the leftmost column of both boards on the wall. */
const START = "2026-08-24";

const PRODUCTION: SeedBoard = {
  key: "production",
  title: "Production",
  scale: "week",
  startDate: START,
  columns: 20,
  // Labor Day 2026 is Monday 7 September, which is the third column. On the
  // wall it is a strip of orange tape running the full height of the board.
  markers: [{ column: 2, label: "Labor Day", color: "orange" }],
  sections: [
    {
      id: "db-a",
      title: "Design · Build",
      rows: [
        { label: "Caporasso", d: "CK·MK / AC", cm: "CK", pm: "NG", color: "red", bars: [{ start: 0, span: 3, color: "blue" }] },
        { label: "Geffner", pm: "NG", color: "red", bars: [{ start: 1, span: 8, color: "red" }] },
        { label: "Migirov", pm: "NG", color: "red" },
        { label: "Narcisse", pm: "NG", color: "red", bars: [{ start: 3, span: 2, color: "green" }] },
        { label: "Clayton", pm: "NU", color: "red" },
        { label: "Hans", pm: "NU", color: "red" },
        { label: "Kirby", pm: "NG", color: "red", bars: [{ start: 8, span: 1, color: "green" }] },
        { label: "Astigiraga", cm: "MK", pm: "NG", color: "red" },
        { label: "Calandra", pm: "NG", color: "red", bars: [{ start: 11, span: 1, color: "green" }] },
        { label: "Drews", pm: "HU", color: "red" },
      ],
    },
    {
      id: "db-b",
      title: "",
      rows: [
        { label: "Gulbrandsen", pm: "NG", color: "red", bars: [{ start: 5, span: 2, color: "red", tentative: true }] },
        { label: "Buckingham", pm: "NG", color: "red", bars: [{ start: 9, span: 2, color: "green" }] },
        { label: "Braumann", pm: "NG", color: "red" },
      ],
    },
    {
      id: "hold",
      title: "On hold",
      rows: [{ label: "Meranus", color: "blue" }],
    },
    {
      id: "db-c",
      title: "",
      rows: [
        { label: "Curry", d: "JR·DC / SM", cm: "JR", pm: "NG", color: "green", bars: [{ start: 0, span: 2, color: "green" }] },
        { label: "Kramer", pm: "JT", color: "green", bars: [{ start: 1, span: 2, color: "green" }] },
        { label: "Clarke", pm: "JT", color: "green", bars: [{ start: 0, span: 1, color: "blue" }] },
        { label: "Muirhead", pm: "NG", color: "green", bars: [{ start: 0, span: 7, color: "red" }] },
        { label: "Saluzzo", pm: "NU", color: "green", bars: [{ start: 6, span: 1, color: "red" }] },
        { label: "Luhadia", pm: "JT", color: "green", bars: [{ start: 0, span: 3, color: "blue" }] },
        { label: "Williams", pm: "NU", color: "green", bars: [{ start: 0, span: 2, color: "green" }] },
        { label: "Callaghan", pm: "NU", color: "green", bars: [{ start: 0, span: 3, color: "green" }] },
        { label: "Robbins", pm: "NG", color: "green" },
      ],
    },
    {
      id: "db-d",
      title: "",
      rows: [{ label: "Dunmore", pm: "NG", color: "green", bars: [{ start: 0, span: 2, color: "green" }] }],
    },
    {
      id: "crews",
      title: "Crews",
      rows: [
        {
          label: "Niuver",
          color: "green",
          note: "Caporasso · Geffner · Narcisse · Curry",
          bars: [
            { start: 0, span: 2, label: "Rakow cont.", color: "green" },
            { start: 2, span: 4, label: "Williams", color: "green" },
            { start: 6, span: 3, label: "Geffner", color: "green" },
            { start: 9, span: 5, label: "Curry", color: "green" },
          ],
        },
        {
          label: "Carlos",
          color: "red",
          note: "Saluzzo · Clayton · Dunmore",
          bars: [
            { start: 0, span: 2, label: "Saluzzo", color: "red" },
            { start: 2, span: 2, label: "Dunmore", color: "red" },
            { start: 4, span: 10, label: "Clayton", color: "red" },
          ],
        },
        {
          label: "Miguel",
          color: "orange",
          note: "Saluzzo · Hans · Callaghan · Dunmore",
          bars: [
            { start: 0, span: 2, label: "Dunmore", color: "orange" },
            { start: 2, span: 12, label: "Drews", color: "orange" },
          ],
        },
        {
          label: "Domingo",
          color: "blue",
          note: "Kramer · Clarke",
          bars: [
            { start: 0, span: 5, label: "Kramer", color: "blue" },
            { start: 5, span: 9, label: "Kramer cont.", color: "blue" },
          ],
        },
      ],
    },
  ],
};

/**
 * The narrow board to the right of the wall, which is booked by the day rather
 * than by the week.
 *
 * On the wall it is two separate tables, one per week. Here it is one ruler of
 * fourteen days with the two weeks as sections, so that a job which slips from
 * Friday to Monday is dragged across the join instead of being deleted from one
 * table and retyped into the other.
 */
const ENHANCEMENTS: SeedBoard = {
  key: "enhancements",
  title: "Enhancements",
  scale: "day",
  startDate: START,
  columns: 14,
  // No Labor Day rule here: it falls on Monday 7 September, the day after this
  // ruler ends. Stretch the board and it can be marked by hand.
  markers: [],
  sections: [
    {
      id: "week-1",
      title: "August",
      rows: [
        { label: "Drews", color: "ink" },
        { label: "Muirhead", color: "ink" },
        { label: "Mount", color: "ink" },
        { label: "Brown 2.0", color: "ink", bars: [{ start: 0, span: 2, color: "red" }] },
        { label: "Bernstein", color: "ink", bars: [{ start: 0, span: 2, color: "red" }] },
        { label: "Cafasso", color: "ink" },
        { label: "O'Sullivan", color: "ink", bars: [{ start: 1, span: 4, color: "red" }] },
        { label: "Lefkovits 2.0", color: "ink" },
      ],
    },
    {
      id: "week-2",
      title: "Aug / Sept",
      rows: [
        { label: "Farina", color: "ink" },
        { label: "Dell Chiaie", color: "ink" },
        { label: "Mann", color: "ink", bars: [{ start: 10, span: 2, color: "red" }] },
        { label: "Drews", color: "ink", bars: [{ start: 7, span: 4, color: "red" }] },
        { label: "Welsh", color: "ink" },
        { label: "O'Sullivan", color: "ink" },
        { label: "Shapiro", color: "ink" },
      ],
    },
  ],
};

const BOARDS = [PRODUCTION, ENHANCEMENTS];

export type SeedPayload = {
  boards: {
    key: string;
    title: string;
    scale: "week" | "day";
    startDate: string;
    columns: number;
    markers: { id: string; column: number; label: string; color: MarkerColor }[];
    sections: { id: string; title: string }[];
  }[];
  rows: {
    boardKey: string;
    section: string;
    order: number;
    label: string;
    d?: string;
    cm?: string;
    pm?: string;
    note?: string;
    color: MarkerColor;
    bars: Bar[];
  }[];
};

/**
 * The seed flattened into what the mutation stores.
 *
 * Ids are derived from position rather than random, so seeding twice produces
 * the same document twice — useful when a board has to be wiped and refilled
 * during setup, and it keeps this function pure, which is what lets a test
 * compare its output to a fixture.
 */
export function calendarSeed(): SeedPayload {
  const boards: SeedPayload["boards"] = [];
  const rows: SeedPayload["rows"] = [];

  for (const board of BOARDS) {
    boards.push({
      key: board.key,
      title: board.title,
      scale: board.scale,
      startDate: board.startDate,
      columns: board.columns,
      markers: board.markers
        // A marker past the end of the ruler is dropped rather than clamped onto
        // the last column, where it would look like a real deadline.
        .filter((marker) => marker.column >= 0 && marker.column < board.columns)
        .map((marker, index) => ({ id: `${board.key}-m${index}`, ...marker })),
      sections: board.sections.map((section) => ({ id: section.id, title: section.title })),
    });

    let order = 0;

    for (const section of board.sections) {
      for (const row of section.rows) {
        order += ORDER_STEP;
        rows.push({
          boardKey: board.key,
          section: section.id,
          order,
          label: row.label,
          d: row.d,
          cm: row.cm,
          pm: row.pm,
          note: row.note,
          color: row.color,
          bars: (row.bars ?? []).map((bar, index) => ({
            id: `${board.key}-${section.id}-${order}-${index}`,
            start: bar.start,
            span: bar.span,
            color: bar.color ?? row.color,
            label: bar.label,
            tentative: bar.tentative,
          })),
        });
      }
    }
  }

  return { boards, rows };
}
