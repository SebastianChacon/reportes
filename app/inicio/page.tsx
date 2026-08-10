import { api } from "@/convex/_generated/api";
import { convexServer } from "@/lib/convexServer";
import { officeAccess } from "@/lib/officeSession";
import { todayForOffice } from "@/lib/officeDate";
import { systemStatus } from "@/lib/systemStatus";
import { HomeShell, type Today } from "@/components/home/HomeShell";

/**
 * The front door.
 *
 * Everything on this page is either a link to a real screen or a fact about
 * this server read at request time. Nothing is a claim: the capability list
 * describes behaviour that the code underneath actually has, and anything that
 * depends on configuration reports its own state instead of asserting it works.
 *
 * Never cached. Its whole job is to answer "what is this server doing right
 * now", and a version of that answer from a minute ago is a different question.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = systemStatus();
  const access = await officeAccess();

  // The day's numbers are business data, and this page is not behind the door.
  // Unconfigured and signed-out are told apart on purpose: one is a server
  // nobody finished setting up, the other is a reader who has not signed in,
  // and the fix is different for each.
  let today: Today = null;

  if (access.state === "ok") {
    const convex = convexServer();
    if (convex) {
      const date = todayForOffice();
      const [board, missing] = await Promise.all([
        convex.query(api.office.dayBoard, { date }),
        convex.query(api.office.missingToday, { date }),
      ]);
      today = {
        reports: board.summary.reports,
        people: board.summary.people,
        crewHours: board.summary.crewHours,
        materialsCost: board.summary.materialsCost,
        notFiled: missing.missing.length,
      };
    }
  }

  return (
    <HomeShell
      status={status}
      today={today}
      access={access.state === "ok" ? "in" : access.state === "anonymous" ? "out" : "unconfigured"}
    />
  );
}
