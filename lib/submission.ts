import {
  crewTotalHours,
  materialsTotalCost,
  onSiteHours,
  totalDayHours,
  travelHours,
  warnings,
} from "./calc";
import type { JobReport } from "./types";

/**
 * Turns a finished JobReport into exactly what gets stored.
 *
 * Deliberately free of any Convex import: the mutation stays a thin wrapper
 * around this, and every rule below — what counts as a flag, who gets a
 * personId, how a day is totalled — is unit-testable without a deployment.
 */

/* ------------------------------------------------------------------ */
/* Stored shapes                                                       */
/* ------------------------------------------------------------------ */

export type ReportStatus = "submitted" | "needs_review" | "approved";

/** Computed once, at write time, so the console can never disagree with the PDF. */
export type ReportTotals = {
  dayHours: number | null;
  onSiteHours: number | null;
  travelHours: number | null;
  crewHours: number;
  materialsCost: number;
};

/** A soft check that survived into storage, so the review queue needs no re-run. */
export type ReportFlag = { key: string; field: string | null };

/**
 * One row per person per report.
 *
 * This is the table that makes "pick a person, see their day" a single indexed
 * read. Crew lives inside the report as a nested array, and no index can reach
 * into that — so it is fanned out here, in the same write, and can never drift.
 */
export type CrewDayRow = {
  /** Catalog id. Null when the foreman typed a name that is not on the roster. */
  personId: string | null;
  name: string;
  roles: string[];
  hours: number | null;
  adhoc: boolean;
  /* Denormalized so the roster and the person-day view never join back. */
  date: string;
  clientName: string;
  jobNumber: string | null;
};

export type Submission = {
  /** Idempotency key. Two sends of the same report must not become two rows. */
  clientId: string;
  report: StoredReport;
  crewDays: CrewDayRow[];
};

export type StoredReport = {
  clientId: string;
  formVersion: string;
  filledInLang: string;

  date: string;
  clientName: string;
  jobNumbers: string[];
  truckNumbers: string[];

  startYard: string;
  startJob: string;
  endJob: string;
  endYard: string;
  lunchMinutes: number;

  description: {
    original: string;
    originalLang: string;
    translation: string | null;
    translationLang: string | null;
    unknownTerms: string[];
  };

  crew: { personId: string | null; name: string; roles: string[]; hours: number | null; adhoc: boolean }[];
  equipment: JobReport["equipment"];
  materials: JobReport["materials"];
  plants: JobReport["plants"];
  subcontractors: JobReport["subcontractors"];
  trucks: JobReport["trucks"];

  mileageTrips: number | null;
  mileageWhere: string;
  disposals: string;
  notes: string;

  totals: ReportTotals;
  flags: ReportFlag[];
  status: ReportStatus;
  photoCount: number;

  submittedAt: string;
};

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

function slug(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "unknown";
}

/**
 * A stable id for this submission.
 *
 * Reports queued by a build that predates `JobReport.id` still have to be
 * replayable from the outbox without landing twice, so those fall back to a key
 * derived from the fields that identify the send. `submittedAt` is stamped once
 * when the foreman hits send and travels with the queued copy, which is what
 * makes the derived key stable across retries rather than new on every attempt.
 */
export function submissionKey(report: JobReport): string {
  if (report.id) return report.id;
  return ["legacy", report.date, slug(report.clientName), report.submittedAt ?? "unsent"].join(":");
}

/**
 * A crew member's roster id, or null when the foreman wrote the name in.
 *
 * StepCrew stamps ad-hoc entries with `adhoc: true` and an id built from the
 * typed name plus a timestamp — unique per report, so it must never be treated
 * as a person. Storing it as a personId would create a new "person" every time
 * the same name is typed, and none of them would ever merge.
 */
export function personIdOf(member: { id: string; adhoc?: boolean }): string | null {
  return member.adhoc ? null : member.id;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

export function reportTotals(report: JobReport): ReportTotals {
  return {
    dayHours: totalDayHours(report),
    onSiteHours: onSiteHours(report),
    travelHours: travelHours(report),
    crewHours: crewTotalHours(report),
    materialsCost: materialsTotalCost(report),
  };
}

/** Anything `warnings()` caught lands in the office's review queue. */
export function reportFlags(report: JobReport): ReportFlag[] {
  return warnings(report).map((w) => ({ key: w.key, field: w.field ?? null }));
}

export function buildSubmission(report: JobReport, submittedAt?: string): Submission {
  const clientId = submissionKey(report);
  const flags = reportFlags(report);
  const stamp = submittedAt ?? report.submittedAt ?? new Date().toISOString();
  const jobNumber = report.jobNumbers[0] ?? null;

  // A report replayed from the outbox or the history can predate any of these
  // fields. Defaulting here rather than at each use keeps one stranded report
  // from being stranded forever by a crash on the way out.
  const photos = report.photos ?? [];

  const crew = (report.crew ?? []).map((member) => ({
    personId: personIdOf(member),
    name: member.name,
    roles: member.roles ?? [],
    hours: member.hours,
    adhoc: member.adhoc === true,
  }));

  const stored: StoredReport = {
    clientId,
    formVersion: report.formVersion,
    filledInLang: report.filledInLang,

    date: report.date,
    clientName: report.clientName,
    jobNumbers: report.jobNumbers,
    truckNumbers: report.truckNumbers,

    startYard: report.startYard,
    startJob: report.startJob,
    endJob: report.endJob,
    endYard: report.endYard,
    lunchMinutes: report.lunchMinutes,

    description: {
      original: report.description.original,
      originalLang: report.description.originalLang,
      translation: report.description.translation,
      translationLang: report.description.translationLang,
      unknownTerms: report.description.unknownTerms ?? [],
    },

    crew,
    equipment: report.equipment ?? [],
    materials: report.materials ?? [],
    plants: report.plants ?? [],
    subcontractors: report.subcontractors ?? [],
    trucks: report.trucks ?? [],

    mileageTrips: report.mileageTrips,
    mileageWhere: report.mileageWhere,
    disposals: report.disposals,
    notes: report.notes,

    totals: reportTotals(report),
    flags,
    // A report the office has to look at should already be in the queue when
    // they open it, rather than waiting for someone to notice the long day.
    status: flags.length > 0 ? "needs_review" : "submitted",
    photoCount: photos.length,

    submittedAt: stamp,
  };

  const crewDays: CrewDayRow[] = crew.map((member) => ({
    personId: member.personId,
    name: member.name,
    roles: member.roles,
    hours: member.hours,
    adhoc: member.adhoc,
    date: report.date,
    clientName: report.clientName,
    jobNumber,
  }));

  return { clientId, report: stored, crewDays };
}
