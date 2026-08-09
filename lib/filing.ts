import { buildSubmission, type CrewDayRow, type StoredReport } from "./submission";
import { dataUrlToBlob } from "./photos";
import type { JobReport } from "./types";

/**
 * Files a sent report with the office.
 *
 * This runs *after* the report has already left the phone by share sheet or
 * email, and it must never interfere with that: a database that is unreachable,
 * unconfigured, or simply not set up yet is a normal state here, not an error
 * the foreman should ever see. Every path below either succeeds quietly or
 * returns a reason — nothing throws.
 */

export type FilingResult =
  /** Landed. */
  | "filed"
  /** Already on file — an outbox retry catching up, which is the desired no-op. */
  | "duplicate"
  /** No database wired up. The app is expected to run this way. */
  | "unconfigured"
  /** Offline, or the write was rejected. Stays in the history for the next try. */
  | "failed";

/** Swapped out in tests, and absent entirely when no deployment is configured. */
export type FilingBackend = {
  /** Uploads one JPEG and returns its storage id. */
  uploadPhoto(dataUrl: string): Promise<string>;
  submit(input: {
    report: StoredReport;
    crewDays: CrewDayRow[];
    photoStorageIds: string[];
  }): Promise<{ duplicate: boolean }>;
};

/**
 * Photos go up first, then the report that points at them.
 *
 * The order matters to the reviewer, not to the database: a report row appears
 * in the office's day board the moment it is written, and one that shows up
 * with its photos still uploading reads as a report filed without photos.
 */
export async function fileReport(
  report: JobReport,
  backend: FilingBackend | null
): Promise<FilingResult> {
  if (!backend) return "unconfigured";

  try {
    const { report: stored, crewDays } = buildSubmission(report);

    const photoStorageIds: string[] = [];
    for (const dataUrl of report.photos ?? []) {
      photoStorageIds.push(await backend.uploadPhoto(dataUrl));
    }

    const { duplicate } = await backend.submit({ report: stored, crewDays, photoStorageIds });
    return duplicate ? "duplicate" : "filed";
  } catch {
    // Offline is the common case and it is not a failure worth surfacing: the
    // report is in the phone's history and the next reconnect will retry it.
    return "failed";
  }
}

/* ------------------------------------------------------------------ */
/* The Convex backend                                                  */
/* ------------------------------------------------------------------ */

/** Set once a deployment exists. Without it the app behaves exactly as before. */
export function convexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  return url ? url : null;
}

type ConvexLikeClient = { mutation(reference: unknown, args: unknown): Promise<unknown> };

/**
 * Built against string function references rather than `convex/_generated/api`,
 * so the app compiles and ships before anyone has run `npx convex dev`. The
 * generated types replace these once a deployment exists.
 */
export function makeConvexBackend(client: ConvexLikeClient, refs: {
  uploadUrl: unknown;
  submit: unknown;
}): FilingBackend {
  return {
    async uploadPhoto(dataUrl) {
      const url = (await client.mutation(refs.uploadUrl, {})) as string;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: dataUrlToBlob(dataUrl),
      });
      if (!response.ok) throw new Error(`photo_upload_failed_${response.status}`);
      const body = (await response.json()) as { storageId?: string };
      if (!body.storageId) throw new Error("photo_upload_no_storage_id");
      return body.storageId;
    },

    async submit(input) {
      const result = (await client.mutation(refs.submit, input)) as { duplicate?: boolean };
      return { duplicate: result?.duplicate === true };
    },
  };
}
