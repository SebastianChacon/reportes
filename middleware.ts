import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Keeps the destination when the console turns someone away.
 *
 * The gate itself is, and stays, `app/office/(console)/layout.tsx` — that is
 * where the cookie is actually verified, and putting a second authority here
 * would mean two places that can disagree about who is allowed in. This does
 * something much smaller and purely cosmetic: a layout cannot see the URL it is
 * rendering, so its `redirect("/office/entrar")` throws away the page the
 * reader was trying to reach. Middleware can see it, so it sends them to the
 * door with `?next=` attached and the sign-in form puts them back.
 *
 * It therefore checks only whether a session cookie is **present**, never
 * whether it is valid. A forged or expired cookie sails past this and is
 * refused by the layout exactly as before; the only thing lost in that case is
 * the nicety of returning to the right page. That asymmetry is deliberate —
 * this file must never be the reason someone gets in.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const door = new URL("/office/entrar", request.url);
  door.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(door);
}

export const config = {
  /*
   * Everything under `/office` except the door itself, which must stay
   * reachable without a session — redirecting the sign-in page to the sign-in
   * page is an infinite loop.
   *
   * `/api` is not matched: those routes answer with a JSON 401, and a fetch
   * that receives a 307 to an HTML page instead reports a parse error rather
   * than an authentication one.
   */
  matcher: ["/office", "/office/((?!entrar).*)"],
};
