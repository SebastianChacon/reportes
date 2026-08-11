import { type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import { officeAccess } from "@/lib/officeSession";
import { csvFilename, toCsv } from "@/lib/csv";
import { CONSOLE_LANG, tc } from "@/lib/i18n";
import { parsePeriod } from "@/lib/officePeriod";
import { MEASURE_LABEL, MEASURES, parseBreakdown, plainValue } from "@/lib/officeBreakdown";

export const runtime = "nodejs";

/**
 * The advanced table, as a file.
 *
 * The point of this route is that somebody stops asking the office to email
 * them a spreadsheet. So it answers the **same** question the screen answers,
 * from the same query with the same parameters read out of the same URL — an
 * export whose rows did not match the table above it would be worse than no
 * export, because the difference would be found by somebody else, later.
 *
 * The gate is checked here rather than inherited. A route handler is not inside
 * the `(console)` layout — layouts do not run for routes — so "the page rendered
 * for you" is not a reason to hand this file to whoever asks for it. This is
 * every client name and every dollar the company spent, in one download.
 */
export async function GET(request: NextRequest) {
  const access = await officeAccess();
  if (access.state !== "ok") {
    return new Response(tc("exportSignedOut"), { status: 401 });
  }

  const convex = convexServer();
  if (!convex) return new Response(tc("unconfigured"), { status: 503 });

  // The same two parsers the page uses, over the same query string.
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const period = parsePeriod(params);
  const breakdown = parseBreakdown(params);

  const result = await convex.query(api.analytics.breakdown, {
    from: period.from,
    to: period.to,
    by: breakdown.by,
    ...(breakdown.sort ? { sort: breakdown.sort } : {}),
  });

  const head = [tc("groupBy"), ...MEASURES.map((measure) => tc(MEASURE_LABEL[measure]))];
  const rows = result.rows.map((row) => [
    row.label,
    ...MEASURES.map((measure) => plainValue(row, measure)),
  ]);

  const filename = csvFilename(["reportes", breakdown.by, period.from, period.to]);

  return new Response(toCsv([head, ...rows]), {
    headers: {
      // `charset=utf-8` because client names carry accents, and Excel opens a
      // file without it in the local codepage and turns "Muñoz" into mojibake.
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      // The numbers change as reports land. A cached copy of this is a copy of
      // a different afternoon.
      "cache-control": "no-store",
      "content-language": CONSOLE_LANG,
    },
  });
}
