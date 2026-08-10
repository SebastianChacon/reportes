import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexServer } from "@/lib/convexServer";
import { officeAccess } from "@/lib/officeSession";

export const runtime = "nodejs";

/**
 * Approving a report, or sending it back with a note.
 *
 * Goes through the server for the same reason filing does: `reviewedBy` has to
 * be a name the office can trust, and the only thing that can read the session
 * cookie is the server. A browser allowed to say who approved a report could
 * say anybody approved it.
 *
 * The gate is re-checked here rather than assumed from the page that called it.
 * A route is reachable directly whatever the UI does, and "the console rendered
 * for you" is not proof that you are still signed in by the time you click.
 */

type Body = { reportId?: unknown; status?: unknown; note?: unknown };

const STATUSES = ["approved", "needs_review", "submitted"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const access = await officeAccess();
  if (access.state !== "ok") {
    return NextResponse.json({ ok: false, reason: access.state }, { status: 401 });
  }

  const convex = convexServer();
  if (!convex) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!reportId || !isStatus(body.status)) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  // Sending a report back is a message to a foreman. Without the note it is a
  // status change he cannot act on — the telephone call this replaces.
  if (body.status === "needs_review" && !note) {
    return NextResponse.json({ ok: false, reason: "note_required" }, { status: 400 });
  }

  try {
    await convex.mutation(api.reports.setStatus, {
      reportId: reportId as Id<"reports">,
      status: body.status,
      reviewedBy: access.identity.userId as Id<"users">,
      // Approving passes no note, which clears any that was there: a correction
      // already made should not keep showing as outstanding.
      ...(body.status === "needs_review" ? { note } : {}),
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
