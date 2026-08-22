import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import { tc } from "@/lib/i18n";
import { BoardEditor } from "@/components/office/calendar/BoardEditor";

/**
 * The wall.
 *
 * Behind the console's door rather than out on the site, which is the one thing
 * the earlier version of this board got wrong: it carried client names, crew
 * assignments and who is late, and it was reachable from a public home page. The
 * gate is `app/office/(console)/layout.tsx`, and this file is protected by
 * sitting inside that folder.
 *
 * Never cached. The board is a shared surface — two people edit it in the same
 * afternoon — and a cached copy would show one of them a schedule the other has
 * already changed, which is exactly the failure the wall does not have.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The board",
  // The wall is internal. Nothing about it should end up in an index, even
  // though the door already refuses anyone who is not signed in.
  robots: { index: false, follow: false },
};

/** Production first, then the narrower panels — the order they hang on the wall. */
const ORDER = ["production", "enhancements"];

export default async function CalendarPage() {
  const convex = convexServer();
  // The layout refuses to render this without a deployment configured, so
  // reaching here with none would be a bug rather than a state.
  if (!convex) return null;

  const { boards, rows, truncated } = await convex.query(api.calendar.everything, {});

  const ordered = [...boards].sort((a, b) => {
    const left = ORDER.indexOf(a.key);
    const right = ORDER.indexOf(b.key);
    // A board nobody named goes to the end, in alphabetical order, rather than
    // to the front — the two known boards are the ones the office reads first.
    return (left < 0 ? ORDER.length : left) - (right < 0 ? ORDER.length : right) ||
      a.key.localeCompare(b.key);
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold tracking-tight">{tc("boardTitle")}</h1>
      <BoardEditor boards={ordered} rows={rows} truncated={truncated} />
    </div>
  );
}
