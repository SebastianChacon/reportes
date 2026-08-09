import { v } from "convex/values";

/**
 * Shared between the schema and the mutations that write to it.
 *
 * Keeping one definition means a field can never be accepted by `submit` in a
 * shape the table will reject — the failure would land on a foreman with no
 * signal and no way to report it.
 */

/** Every catalog label is carried in both languages, exactly as the form stores it. */
export const l10n = v.object({ en: v.string(), es: v.string() });

/** A quantity the foreman may simply not have filled in. Absent is not zero. */
export const maybeNumber = v.union(v.number(), v.null());

export const equipmentEntry = v.object({
  id: v.string(),
  label: l10n,
  owner: v.union(v.literal("BTN"), v.literal("RENTAL")),
  qty: maybeNumber,
  hours: maybeNumber,
  adhoc: v.optional(v.boolean()),
});

export const materialEntry = v.object({
  id: v.string(),
  label: l10n,
  source: v.union(v.literal("BTN"), v.literal("OTHER")),
  qty: maybeNumber,
  cost: maybeNumber,
  adhoc: v.optional(v.boolean()),
});

export const plantEntry = v.object({
  id: v.string(),
  category: v.union(
    v.literal("tree"),
    v.literal("shrub"),
    v.literal("perennial"),
    v.literal("annual")
  ),
  name: v.string(),
  qty: maybeNumber,
  size: v.string(),
  vendor: v.string(),
  cost: maybeNumber,
});

export const subcontractorEntry = v.object({
  id: v.string(),
  trade: v.string(),
  tradeLabel: l10n,
  vendor: v.string(),
  description: v.string(),
});

export const truckEntry = v.object({ id: v.string(), label: l10n, hours: maybeNumber });

/** Crew as stored on the report itself. The queryable copy lives in `crewDays`. */
export const crewMember = v.object({
  personId: v.union(v.string(), v.null()),
  name: v.string(),
  roles: v.array(v.string()),
  hours: maybeNumber,
  adhoc: v.boolean(),
});

export const reportStatus = v.union(
  v.literal("submitted"),
  v.literal("needs_review"),
  v.literal("approved")
);

/** Exactly what the phone sends. Anything the office decides later is not in here. */
export const submittedReportFields = {
  /**
   * The report's own id, generated on the phone. `submit` looks this up before
   * inserting, which is what makes an outbox retry on flaky signal idempotent
   * rather than a duplicate day.
   */
  clientId: v.string(),
  formVersion: v.string(),
  filledInLang: v.string(),

  date: v.string(), // YYYY-MM-DD, so lexical order is chronological order
  clientName: v.string(),
  jobNumbers: v.array(v.string()),
  truckNumbers: v.array(v.string()),

  startYard: v.string(),
  startJob: v.string(),
  endJob: v.string(),
  endYard: v.string(),
  lunchMinutes: v.number(),

  description: v.object({
    original: v.string(),
    originalLang: v.string(),
    translation: v.union(v.string(), v.null()),
    translationLang: v.union(v.string(), v.null()),
    unknownTerms: v.array(v.string()),
  }),

  crew: v.array(crewMember),
  equipment: v.array(equipmentEntry),
  materials: v.array(materialEntry),
  plants: v.array(plantEntry),
  subcontractors: v.array(subcontractorEntry),
  trucks: v.array(truckEntry),

  mileageTrips: maybeNumber,
  mileageWhere: v.string(),
  disposals: v.string(),
  notes: v.string(),

  /** Worked out once, at write time, from lib/calc.ts — never recomputed on read. */
  totals: v.object({
    dayHours: maybeNumber,
    onSiteHours: maybeNumber,
    travelHours: maybeNumber,
    crewHours: v.number(),
    materialsCost: v.number(),
  }),

  /** Soft checks that survived into storage, so the review queue needs no re-run. */
  flags: v.array(v.object({ key: v.string(), field: v.union(v.string(), v.null()) })),

  status: reportStatus,

  /** Denormalised so the day list shows "4 photos" without reading the photos table. */
  photoCount: v.number(),

  submittedAt: v.string(),
};

/** The stored row: what the phone sent, plus everything the office adds afterwards. */
export const reportFields = {
  ...submittedReportFields,
  submittedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.string()),
  reviewedBy: v.optional(v.id("users")),
};

/** A crew row as the phone sends it — `reportId` is attached by the mutation. */
export const submittedCrewDayFields = {
  /** Roster id. Null when the foreman wrote a name in that is not on the list. */
  personId: v.union(v.string(), v.null()),
  name: v.string(),
  roles: v.array(v.string()),
  hours: maybeNumber,
  adhoc: v.boolean(),

  date: v.string(),
  clientName: v.string(),
  jobNumber: v.union(v.string(), v.null()),
};

export const crewDayFields = {
  reportId: v.id("reports"),
  ...submittedCrewDayFields,
};
