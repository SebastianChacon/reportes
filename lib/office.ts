import { convexUrl, fileReport, type FilingResult } from "./filing";
import type { JobReport } from "./types";

/**
 * Sends the office its copy of a report that has already left the phone.
 *
 * The Convex client is pulled in only once a deployment is actually configured,
 * so a build without one never downloads it — the foreman's critical path stays
 * exactly the size it was. Nothing here throws: filing is a background courtesy
 * on top of a send that already succeeded.
 */
export async function fileWithOffice(report: JobReport): Promise<FilingResult> {
  if (!convexUrl()) return "unconfigured";

  try {
    const { filingBackend } = await import("./convexBackend");
    return await fileReport(report, filingBackend());
  } catch {
    // The chunk failed to load — offline, most likely. The report stays in the
    // phone's history and the next reconnect tries again.
    return "failed";
  }
}
