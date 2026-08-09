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

export const runtime = "nodejs";

/**
 * The foreman claims his name once, and the phone is his from then on.
 *
 * `GET` answers which roster names already have a PIN, so the phone can ask for
 * one instead of offering to set one. It is not a secret worth protecting: the
 * roster ships inside the app, and knowing that Miguel has enrolled gets you no
 * closer to filing as him.
 *
 * `POST` sets the session cookie. The PIN is checked inside Convex, not here —
 * see convex/auth.ts. This route's only job is to turn a proven identity into a
 * cookie the browser cannot read.
 */

type Body = { crewMemberId?: unknown; pin?: unknown; mode?: unknown };

function unconfigured() {
  // Not an error the user can act on, and not a reason to block a report. The
  // phone treats this as "no identity available" and files as it always has.
  return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
}

export async function GET() {
  const convex = convexServer();
  if (!convex || !isConfigured()) return unconfigured();

  try {
    const enrolled = await convex.action(api.auth.enrolled, {});
    return NextResponse.json({ ok: true, enrolled });
  } catch {
    return NextResponse.json({ ok: false, reason: "unreachable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const convex = convexServer();
  if (!convex || !isConfigured()) return unconfigured();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const crewMemberId = typeof body.crewMemberId === "string" ? body.crewMemberId : "";
  const pin = typeof body.pin === "string" ? body.pin : "";
  const mode = body.mode === "enrol" ? "enrol" : "signIn";

  if (!crewMemberId || !pin) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof convex.action<typeof api.auth.signIn>>>;
  try {
    result =
      mode === "enrol"
        ? await convex.action(api.auth.enrol, { crewMemberId, pin })
        : await convex.action(api.auth.signIn, { crewMemberId, pin });
  } catch {
    return NextResponse.json({ ok: false, reason: "unreachable" }, { status: 502 });
  }

  if (!result.ok) {
    // 401 for a wrong PIN, 409 for "this name already has one" — the second is
    // not a failed attempt and must not read like one on the phone.
    const status = result.reason === "enrolled" || result.reason === "not_enrolled" ? 409 : 401;
    return NextResponse.json(result, { status });
  }

  const identity: Identity = result.identity;
  const token = await signSession(identity);
  if (token === null) return unconfigured();

  const response = NextResponse.json({
    ok: true,
    identity: { name: identity.name, role: identity.role, crewMemberId: identity.crewMemberId },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(ttlFor(identity.role)));
  return response;
}
