import { NextResponse, type NextRequest } from "next/server";
import {
  readSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  isConfigured,
} from "@/lib/session";

export const runtime = "nodejs";

/**
 * Who this phone belongs to, and how to stop belonging to them.
 *
 * The cookie is httpOnly, so the app cannot read its own session — this route is
 * how the header learns whose name to show. `userId` is deliberately not in the
 * reply: the page has no use for it and it is the value that makes a session
 * worth stealing.
 */

export async function GET(request: NextRequest) {
  if (!isConfigured()) {
    // Distinguished from "signed out" on purpose: the phone should not offer to
    // sign in when there is nothing behind it to sign in to.
    return NextResponse.json({ configured: false, identity: null });
  }

  const identity = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({
    configured: true,
    identity: identity
      ? { name: identity.name, role: identity.role, crewMemberId: identity.crewMemberId }
      : null,
  });
}

/** Hands the phone back. Used when a foreman lends it, or picked the wrong name. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
