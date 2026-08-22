import type { Bar, BoardMarker, BoardSection, MarkerColor, Scale } from "./calendarBoard";

/**
 * The board's half of the wire, from the browser's side.
 *
 * Every edit goes to `/api/office/calendar` rather than to Convex directly, for
 * the reason `app/api/office/calendar/route.ts` sets out: the person who made
 * the change is read from the session cookie, and a browser that could name
 * itself could name anyone. This module exists so the editor components never
 * write a `fetch` and never have to remember `credentials: "same-origin"` —
 * omitting it on one call is the kind of bug that only shows up in production.
 */

export type BoardEdit =
  | { action: "seed" }
  | {
      action: "board";
      key: string;
      title?: string;
      scale?: Scale;
      startDate?: string;
      columns?: number;
      markers?: BoardMarker[];
      sections?: BoardSection[];
    }
  | { action: "addRow"; boardKey: string; section: string; order: number; label?: string; color?: MarkerColor }
  | {
      action: "updateRow";
      rowId: string;
      section?: string;
      label?: string;
      d?: string;
      cm?: string;
      pm?: string;
      note?: string;
      color?: MarkerColor;
      bars?: Bar[];
    }
  | { action: "deleteRow"; rowId: string }
  | { action: "reorder"; orders: { rowId: string; order: number }[] };

export type EditResult =
  | { ok: true; rowId?: string; seeded?: string[] }
  | { ok: false; reason: string };

export async function sendEdit(edit: BoardEdit): Promise<EditResult> {
  try {
    const response = await fetch("/api/office/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      /*
        So a save that leaves as the tab is closing still arrives. The editor
        flushes its pending writes on `pagehide`, and without this the browser
        is entitled to cancel them the moment the page goes — which is exactly
        the save that matters most, the one nobody waited for.

        Safe here because `keepalive` caps the body at 64KB and the largest edit
        this sends is one row: a name and a handful of bars.
      */
      keepalive: true,
      body: JSON.stringify(edit),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; reason?: string; rowId?: string; seeded?: string[] }
      | null;

    if (!response.ok || !payload?.ok) {
      // The reason is carried through so the editor can tell "your session ran
      // out" apart from "that did not save" — one of those is fixed by signing
      // in again and the other by trying again.
      return { ok: false, reason: payload?.reason ?? String(response.status) };
    }

    return { ok: true, rowId: payload.rowId, seeded: payload.seeded };
  } catch {
    // Offline, or the tab was closed mid-flight. Indistinguishable from here and
    // treated the same: the change is still on screen, and it did not land.
    return { ok: false, reason: "offline" };
  }
}
