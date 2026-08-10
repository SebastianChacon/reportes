import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import {
  isConfigured,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  ttlFor,
  type Identity,
} from "@/lib/session";
import { isOfficeRole } from "@/lib/officeSession";

export const runtime = "nodejs";

/**
 * The office's sign-in, and its sign-out.
 *
 * Mirrors `../foreman/route.ts` — the password is checked inside Convex and
 * this route only turns a proven identity into a cookie the browser cannot
 * read. The differences are both deliberate: the session lasts twelve hours
 * rather than ninety days, because a console is opened on desks that get
 * shared, and there is no enrolment half. An office account is created from an
 * authenticated CLI (`auth:createOfficeAccount`), never from this door.
 */

type Body = { email?: unknown; password?: unknown };

export async function POST(request: NextRequest) {
  const convex = convexServer();
  if (!convex || !isConfigured()) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    // Same shape as a wrong password on purpose: an empty field is not worth a
    // distinct answer, and the form already stops this from reaching here.
    return NextResponse.json({ ok: false, reason: "bad_credentials" }, { status: 401 });
  }

  let result: Awaited<ReturnType<typeof convex.action<typeof api.auth.signInOffice>>>;
  try {
    result = await convex.action(api.auth.signInOffice, { email, password });
  } catch {
    return NextResponse.json({ ok: false, reason: "unreachable" }, { status: 502 });
  }

  if (!result.ok) return NextResponse.json(result, { status: 401 });

  // Belt and braces: `signInOffice` already refuses a foreman, and this refuses
  // it again at the only place that mints a console cookie.
  if (!isOfficeRole(result.identity.role)) {
    return NextResponse.json({ ok: false, reason: "not_office" }, { status: 403 });
  }

  const identity: Identity = result.identity;
  const token = await signSession(identity);
  if (token === null) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  const response = NextResponse.json({
    ok: true,
    identity: { name: identity.name, role: identity.role },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(ttlFor(identity.role)));
  return response;
}

/** Leaves the console. Shares the cookie with the phone, so this clears both. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
