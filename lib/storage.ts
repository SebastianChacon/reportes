import type { CrewEntry, JobReport, Lang } from "./types";

const DRAFT_KEY = "btn.jobreport.draft";
const LANG_KEY = "btn.jobreport.lang";
const LAST_CREW_KEY = "btn.jobreport.lastCrew";
const LAST_JOB_KEY = "btn.jobreport.lastJob";
const OUTBOX_KEY = "btn.jobreport.outbox";
const HISTORY_KEY = "btn.jobreport.history";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false when the write was rejected (private mode, or quota exhausted). */
function safeSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    /* private mode / quota — the app still works, it just won't survive a reload */
    return false;
  }
}

/* ---------- language preference ---------- */

export function loadLang(): Lang | null {
  const v = safeGet(LANG_KEY);
  return v === "es" || v === "en" ? v : null;
}

export function saveLang(lang: Lang): void {
  safeSet(LANG_KEY, lang);
}

/** Browser language, used only on the very first visit. */
export function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "es";
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
}

/* ---------- draft autosave ---------- */

export function loadDraft(): JobReport | null {
  const raw = safeGet(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JobReport;
  } catch {
    return null;
  }
}

export type SaveResult = "ok" | "ok-without-photos" | "failed";

/**
 * A dozen 1600px JPEGs as data URLs run well past the ~5MB localStorage budget.
 * Rather than let the whole draft silently stop autosaving from that point on,
 * fall back to saving everything except the photos and say so.
 */
export function saveDraft(report: JobReport): SaveResult {
  if (safeSet(DRAFT_KEY, JSON.stringify(report))) return "ok";
  if (report.photos.length > 0 && safeSet(DRAFT_KEY, JSON.stringify({ ...report, photos: [] }))) {
    return "ok-without-photos";
  }
  return "failed";
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Order-independent equality check, so key ordering differences from spreads/JSON round-trips don't matter. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Clears the draft only if it still matches `report` (ignoring `submittedAt`, which the live
 * draft never carries). Used after a background/outbox retry succeeds: that retry doesn't touch
 * the app's in-progress `report` state, so blindly clearing here could wipe out a *different*
 * draft the user has since started (e.g. after "Start Over") instead of just the one that sent.
 */
export function clearDraftIfUnchanged(report: JobReport): void {
  const current = loadDraft();
  if (!current) return;
  const strip = (r: JobReport) => stableStringify({ ...r, submittedAt: null });
  if (strip(current) === strip(report)) {
    clearDraft();
  }
}

/* ---------- "same crew as last time" ---------- */

export function loadLastCrew(): CrewEntry[] {
  const raw = safeGet(LAST_CREW_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CrewEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveLastCrew(crew: CrewEntry[]): void {
  if (crew.length) safeSet(LAST_CREW_KEY, JSON.stringify(crew));
}

/* ---------- "same job info as last time" ---------- */

export type LastJobInfo = { clientName: string; jobNumbers: string[]; truckNumbers: string[] };

export function loadLastJobInfo(): LastJobInfo | null {
  const raw = safeGet(LAST_JOB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastJobInfo;
  } catch {
    return null;
  }
}

export function saveLastJobInfo(info: LastJobInfo): void {
  if (info.clientName.trim()) safeSet(LAST_JOB_KEY, JSON.stringify(info));
}

/* ---------- outbox: reports finished with no signal ---------- */

export type OutboxItem = { id: string; report: JobReport; queuedAt: string };

export function loadOutbox(): OutboxItem[] {
  const raw = safeGet(OUTBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Returns false when the report could NOT be persisted — the caller must then
 * tell the foreman to download the PDF instead of promising "it's on your phone".
 */
export function queueReport(report: JobReport): boolean {
  const item: OutboxItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    report,
    queuedAt: new Date().toISOString(),
  };
  const outbox = loadOutbox();
  if (safeSet(OUTBOX_KEY, JSON.stringify([...outbox, item]))) return true;

  // Out of room. The photos are the bulk of it and the PDF already carries the
  // report itself, so a queued report without photos beats no report at all.
  const lean: OutboxItem = { ...item, report: { ...report, photos: [] } };
  return safeSet(OUTBOX_KEY, JSON.stringify([...outbox, lean]));
}

export function removeFromOutbox(id: string): void {
  safeSet(OUTBOX_KEY, JSON.stringify(loadOutbox().filter((i) => i.id !== id)));
}

/* ---------- history: reports that already went out ---------- */

/** How the report left the phone. Worth recording: "shared" is the only one
 *  where we never saw a delivery confirmation, so the history has to keep it. */
export type SentVia = "share" | "email" | "server";

export type HistoryEntry = {
  id: string;
  report: JobReport;
  sentAt: string;
  via: SentVia;
  /** True when the phone was too full to keep the photos — distinct from a
   *  report that simply had none, which must not be labelled as lossy. */
  photosDropped?: boolean;
};

/** Enough to cover a couple of weeks of work without eating the storage budget. */
const MAX_HISTORY = 20;

export function loadHistory(): HistoryEntry[] {
  const raw = safeGet(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Keeps a sent report on the phone, newest first.
 *
 * `navigator.share()` resolving means the OS handed the PDF to Gmail — not that
 * the mail went out. Until this existed, clearing the draft right afterwards was
 * the only copy of the report disappearing on the strength of that assumption.
 *
 * Returns false when nothing could be persisted, so the caller can keep the
 * draft instead of promising a copy that isn't there.
 */
export function saveToHistory(report: JobReport, via: SentVia): boolean {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    report,
    sentAt: report.submittedAt ?? new Date().toISOString(),
    via,
  };

  const existing = loadHistory();
  if (safeSet(HISTORY_KEY, JSON.stringify([entry, ...existing].slice(0, MAX_HISTORY)))) return true;

  // Out of room. Photos are the bulk of every entry and the report itself is
  // what the office would ask for, so shed them before shedding reports.
  const lean: HistoryEntry = {
    ...entry,
    report: { ...report, photos: [] },
    photosDropped: report.photos.length > 0,
  };
  const shed: HistoryEntry[] = existing.map((e) => ({
    ...e,
    report: { ...e.report, photos: [] },
    photosDropped: e.photosDropped || e.report.photos.length > 0,
  }));
  for (let keep = shed.length; keep >= 0; keep -= 1) {
    if (safeSet(HISTORY_KEY, JSON.stringify([lean, ...shed.slice(0, keep)]))) return true;
  }
  return false;
}

export function removeFromHistory(id: string): void {
  safeSet(HISTORY_KEY, JSON.stringify(loadHistory().filter((e) => e.id !== id)));
}
