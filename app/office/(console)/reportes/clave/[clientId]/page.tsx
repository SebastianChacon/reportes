import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import { tc } from "@/lib/i18n";

/**
 * Where a link in the report email lands.
 *
 * The email cannot carry a Convex id: it is sent the moment the foreman hits
 * send, and the office's copy is filed afterwards by `lib/office.ts` as a
 * background courtesy that is allowed to fail. So the link carries `clientId` —
 * the key the phone computed before either happened — and this page turns it
 * into the real report and gets out of the way.
 *
 * It is inside `(console)`, so the layout's gate applies: a link forwarded to
 * somebody without an account lands on sign-in, not on a report. That matters
 * more here than anywhere else in the console, because this is the one URL that
 * leaves the building.
 *
 * Three answers, and the middle one is the reason this is a page rather than a
 * redirect in middleware:
 *
 * - **Filed** — redirect to `/office/reportes/[id]`, the canonical URL. A PM who
 *   bookmarks it or pastes it into Slack shares the short one.
 * - **Not filed yet** — the email arrived and the report did not. That is a real,
 *   recoverable state (the phone was out of signal at 6pm and will retry), and
 *   it is not the same thing as a bad link. Saying "not found" here would send
 *   somebody looking for a report that is going to turn up on its own.
 * - **Nothing to look in** — no deployment configured. The console layout has
 *   already said so; this returns null rather than repeating it.
 */
export const dynamic = "force-dynamic";

export default async function ByClientIdPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const convex = convexServer();
  if (!convex) return null;

  let found: { id: string } | null = null;
  try {
    found = await convex.query(api.office.byClientId, {
      // Next.js hands this back already decoded; the key contains colons on
      // reports queued by a build that predates `JobReport.id`.
      clientId: decodeURIComponent(clientId),
    });
  } catch {
    // An outage reads as "not filed yet" rather than as a crash. Both leave the
    // reader with the PDF that came in the same email, which is the honest
    // answer either way.
    found = null;
  }

  if (found !== null) redirect(`/office/reportes/${found.id}`);

  return (
    <div className="card mx-auto max-w-xl p-6 text-center">
      <p className="font-semibold">{tc("notFiledTitle")}</p>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-muted)]">
        {tc("notFiledHint")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-muted)]">
        {tc("notFiledMeanwhile")}
      </p>
      <Link
        href="/office"
        className="mt-5 inline-block rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-2 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
      >
        {tc("backToDay")}
      </Link>
    </div>
  );
}
