import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexServer } from "@/lib/convexServer";
import { readSession, SESSION_COOKIE } from "@/lib/session";
import type { CrewDayRow, StoredReport } from "@/lib/submission";

export const runtime = "nodejs";

/**
 * Files the office's copy of a report, and records who filed it.
 *
 * The identity comes from the httpOnly session cookie and from nowhere else.
 * That is the whole reason this route exists rather than the phone writing to
 * Convex directly: a phone that could name the foreman could name anyone, and
 * `submittedBy` is the field the console's "who did not report today" is built
 * on. A forgeable answer there is worse than no answer.
 *
 * Photos do *not* come through here. They go straight from the phone to Convex
 * storage and arrive as ids — the point of that design was to keep megabytes off
 * the foreman's mobile data, and routing them through a function would undo it.
 */

/** The report JSON without photos is small. Anything near this is not a report. */
const MAX_BYTES = 2 * 1024 * 1024;

type Body = {
  report?: unknown;
  crewDays?: unknown;
  photoStorageIds?: unknown;
};

function looksLikeReport(value: unknown): value is StoredReport {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  // A cheap shape check so an obviously wrong body fails here with a readable
  // status. The real gate is the argument validator in convex/reports.ts, which
  // is shared with the table definition and cannot drift from it.
  return typeof r.clientId === "string" && typeof r.date === "string";
}

export async function POST(request: NextRequest) {
  const convex = convexServer();
  if (!convex) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
  }

  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  if (!looksLikeReport(body.report) || !Array.isArray(body.crewDays)) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const photoStorageIds = Array.isArray(body.photoStorageIds)
    ? body.photoStorageIds.filter((id): id is string => typeof id === "string")
    : [];

  // An unidentified report still gets filed. A foreman who has not enrolled yet,
  // or a report replayed from a phone that predates any of this, must not be
  // turned away — the office would rather have it unattributed than not at all.
  const identity = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  try {
    const result = await convex.mutation(api.reports.submit, {
      report: body.report,
      crewDays: body.crewDays as CrewDayRow[],
      photoStorageIds: photoStorageIds as Id<"_storage">[],
      submittedBy: identity ? (identity.userId as Id<"users">) : undefined,
    });
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      attributed: identity !== null,
    });
  } catch {
    // Convex rejected the write, or it is unreachable. Either way the phone keeps
    // the report in its history and tries again on the next reconnect.
    return NextResponse.json({ ok: false, reason: "rejected" }, { status: 502 });
  }
}
