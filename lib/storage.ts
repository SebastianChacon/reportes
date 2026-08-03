import type { CrewEntry, JobReport, Lang } from "./types";

const DRAFT_KEY = "btn.jobreport.draft";
const LANG_KEY = "btn.jobreport.lang";
const LAST_CREW_KEY = "btn.jobreport.lastCrew";
const LAST_JOB_KEY = "btn.jobreport.lastJob";
const OUTBOX_KEY = "btn.jobreport.outbox";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — the app still works, it just won't survive a reload */
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

export function saveDraft(report: JobReport): void {
  safeSet(DRAFT_KEY, JSON.stringify(report));
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
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

export function queueReport(report: JobReport): void {
  const outbox = loadOutbox();
  outbox.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    report,
    queuedAt: new Date().toISOString(),
  });
  safeSet(OUTBOX_KEY, JSON.stringify(outbox));
}

export function removeFromOutbox(id: string): void {
  safeSet(OUTBOX_KEY, JSON.stringify(loadOutbox().filter((i) => i.id !== id)));
}
