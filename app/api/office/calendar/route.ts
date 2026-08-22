import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexServer } from "@/lib/convexServer";
import { officeAccess } from "@/lib/officeSession";
import { calendarSeed } from "@/lib/calendarSeed";
import {
  MAX_LABEL,
  isMarkerColor,
  isScale,
  type Bar,
  type BoardMarker,
  type BoardSection,
} from "@/lib/calendarBoard";

export const runtime = "nodejs";

/**
 * Every edit the board can receive.
 *
 * One route with an `action` rather than six routes, because they are one
 * conversation: the board editor sends a stream of small changes from a single
 * screen, and splitting them across paths would mean six copies of the same door
 * check for no gain in clarity.
 *
 * The door is checked here and not inherited from the page that called it —
 * exactly as `app/api/office/status/route.ts` explains. A route is reachable
 * whatever the UI is showing, and the browser is never allowed to be the thing
 * that says who is signed in: `updatedBy` is taken from the cookie, never from
 * the body, so the board's history cannot be written in somebody else's name.
 */

type Json = Record<string, unknown>;

const str = (value: unknown, max = MAX_LABEL): string | undefined =>
  typeof value === "string" ? value.slice(0, max) : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Bars are re-read field by field rather than passed through.
 *
 * The mutation clips the numbers and would reject an unknown key outright, so
 * this is not the safety net — it is what turns "the body was the wrong shape"
 * into a 400 the editor can show, instead of a 502 that reads as the deployment
 * being down.
 */
function readBars(value: unknown): Bar[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const bars: Bar[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) return undefined;
    const bar = raw as Json;
    const id = str(bar.id, 64);
    const start = num(bar.start);
    const span = num(bar.span);
    if (!id || start === undefined || span === undefined || !isMarkerColor(bar.color)) {
      return undefined;
    }
    bars.push({
      id,
      start,
      span,
      color: bar.color,
      ...(typeof bar.label === "string" ? { label: bar.label.slice(0, 40) } : {}),
      ...(bar.tentative === true ? { tentative: true } : {}),
    });
  }
  return bars;
}

function readMarkers(value: unknown): BoardMarker[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const markers: BoardMarker[] = [];
  for (const raw of value) {
    const marker = raw as Json;
    const id = str(marker?.id, 64);
    const column = num(marker?.column);
    if (!id || column === undefined || !isMarkerColor(marker?.color)) return undefined;
    markers.push({ id, column, label: str(marker?.label, 40) ?? "", color: marker.color });
  }
  return markers;
}

function readSections(value: unknown): BoardSection[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const sections: BoardSection[] = [];
  for (const raw of value) {
    const section = raw as Json;
    const id = str(section?.id, 64);
    if (!id) return undefined;
    sections.push({ id, title: str(section?.title, 40) ?? "" });
  }
  return sections;
}

const bad = (reason: string, status = 400) =>
  NextResponse.json({ ok: false, reason }, { status });

export async function POST(request: NextRequest) {
  const access = await officeAccess();
  if (access.state !== "ok") {
    return NextResponse.json({ ok: false, reason: access.state }, { status: 401 });
  }

  const convex = convexServer();
  if (!convex) return bad("unconfigured", 503);

  let body: Json;
  try {
    body = (await request.json()) as Json;
  } catch {
    return bad("bad_request");
  }

  const updatedBy = access.identity.userId as Id<"users">;
  const action = str(body.action, 24);

  try {
    switch (action) {
      /**
       * The first fill. The payload is this server's own copy of the
       * transcription — the request body is not read at all, so a signed-in
       * browser cannot use "seed" to write four hundred rows of its choosing in
       * one call, which is the only write here that is not one row at a time.
       */
      case "seed": {
        const { boards, rows } = calendarSeed();
        const result = await convex.mutation(api.calendar.seed, { boards, rows, updatedBy });
        return NextResponse.json({ ok: true, seeded: result.seeded });
      }

      case "board": {
        const key = str(body.key, 40);
        if (!key) return bad("bad_request");

        const markers = body.markers === undefined ? undefined : readMarkers(body.markers);
        if (body.markers !== undefined && markers === undefined) return bad("bad_request");

        const sections = body.sections === undefined ? undefined : readSections(body.sections);
        if (body.sections !== undefined && sections === undefined) return bad("bad_request");

        const scale = body.scale === undefined ? undefined : body.scale;
        if (scale !== undefined && !isScale(scale)) return bad("bad_request");

        await convex.mutation(api.calendar.saveBoard, {
          key,
          title: str(body.title, 40),
          startDate: str(body.startDate, 10),
          columns: num(body.columns),
          ...(scale !== undefined ? { scale } : {}),
          ...(markers !== undefined ? { markers } : {}),
          ...(sections !== undefined ? { sections } : {}),
          updatedBy,
        });
        return NextResponse.json({ ok: true });
      }

      case "addRow": {
        const boardKey = str(body.boardKey, 40);
        const section = str(body.section, 64);
        const order = num(body.order);
        if (!boardKey || !section || order === undefined) return bad("bad_request");
        if (body.color !== undefined && !isMarkerColor(body.color)) return bad("bad_request");

        const rowId = await convex.mutation(api.calendar.addRow, {
          boardKey,
          section,
          order,
          label: str(body.label),
          ...(isMarkerColor(body.color) ? { color: body.color } : {}),
          updatedBy,
        });
        return NextResponse.json({ ok: true, rowId });
      }

      case "updateRow": {
        const rowId = str(body.rowId, 64);
        if (!rowId) return bad("bad_request");

        const bars = body.bars === undefined ? undefined : readBars(body.bars);
        if (body.bars !== undefined && bars === undefined) return bad("bad_request");
        if (body.color !== undefined && !isMarkerColor(body.color)) return bad("bad_request");

        await convex.mutation(api.calendar.updateRow, {
          rowId: rowId as Id<"calendarRows">,
          section: str(body.section, 64),
          label: str(body.label),
          d: str(body.d, 24),
          cm: str(body.cm, 12),
          pm: str(body.pm, 12),
          note: str(body.note, 120),
          ...(isMarkerColor(body.color) ? { color: body.color } : {}),
          ...(bars !== undefined ? { bars } : {}),
          updatedBy,
        });
        return NextResponse.json({ ok: true });
      }

      case "deleteRow": {
        const rowId = str(body.rowId, 64);
        if (!rowId) return bad("bad_request");
        await convex.mutation(api.calendar.deleteRow, { rowId: rowId as Id<"calendarRows"> });
        return NextResponse.json({ ok: true });
      }

      case "reorder": {
        if (!Array.isArray(body.orders)) return bad("bad_request");

        const orders: { rowId: Id<"calendarRows">; order: number }[] = [];
        for (const raw of body.orders) {
          const entry = raw as Json;
          const rowId = str(entry?.rowId, 64);
          const order = num(entry?.order);
          if (!rowId || order === undefined) return bad("bad_request");
          orders.push({ rowId: rowId as Id<"calendarRows">, order });
        }

        await convex.mutation(api.calendar.reorderRows, { orders });
        return NextResponse.json({ ok: true });
      }

      default:
        return bad("bad_request");
    }
  } catch {
    /*
      A mutation that threw. The two live causes are a row somebody else deleted
      while this screen still showed it, and a payload the validators refused —
      both of which the editor answers the same way: say the change did not
      land, keep it on screen, and let the reader retry or reload.
    */
    return bad("failed", 502);
  }
}
