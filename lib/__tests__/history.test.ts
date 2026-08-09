import { afterEach, describe, expect, it, vi } from "vitest";
import { loadHistory, saveToHistory } from "../storage";
import { emptyReport, type JobReport } from "../types";

const PHOTO = `data:image/jpeg;base64,${"A".repeat(1024)}`;

function report(over: Partial<JobReport> = {}): JobReport {
  return { ...emptyReport("en"), clientName: "Salazar", ...over };
}

/** Simulates a full localStorage, exactly as `quota.test.ts` does for the draft. */
function capStorageAt(limit: number) {
  const store = new Map<string, string>();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    if (String(value).length > limit) throw new DOMException("quota", "QuotaExceededError");
    store.set(String(key), String(value));
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => store.get(String(key)) ?? null);
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("saveToHistory", () => {
  it("keeps the report that was just sent, newest first", () => {
    expect(saveToHistory(report({ clientName: "Salazar" }), "share")).toBe(true);
    expect(saveToHistory(report({ clientName: "Muñoz" }), "share")).toBe(true);

    const entries = loadHistory();
    expect(entries).toHaveLength(2);
    expect(entries[0].report.clientName).toBe("Muñoz");
    expect(entries[0].via).toBe("share");
  });

  it("records how the report left, so a share is not mistaken for a delivery", () => {
    saveToHistory(report(), "server");
    expect(loadHistory()[0].via).toBe("server");
  });

  it("stops at 20 so the history never eats the storage the draft needs", () => {
    for (let i = 0; i < 25; i += 1) saveToHistory(report({ clientName: `Job ${i}` }), "share");

    const entries = loadHistory();
    expect(entries).toHaveLength(20);
    expect(entries[0].report.clientName).toBe("Job 24");
    expect(entries.at(-1)?.report.clientName).toBe("Job 5");
  });

  it("drops the photos rather than losing the report when the phone is full", () => {
    capStorageAt(4000);
    expect(saveToHistory(report({ photos: Array(20).fill(PHOTO) }), "share")).toBe(true);

    const entries = loadHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].report.photos).toEqual([]);
    expect(entries[0].report.clientName).toBe("Salazar");
    expect(entries[0].photosDropped).toBe(true);
  });

  it("does not claim photos were dropped from a report that never had any", () => {
    saveToHistory(report({ photos: [] }), "share");
    expect(loadHistory()[0].photosDropped).toBeFalsy();
  });

  it("sheds older reports to make room for the one that was just sent", () => {
    saveToHistory(report({ clientName: "Old" }), "share");
    // Now only one photoless entry fits at a time.
    capStorageAt(700);
    expect(saveToHistory(report({ clientName: "New" }), "share")).toBe(true);

    const entries = loadHistory();
    expect(entries[0].report.clientName).toBe("New");
    expect(entries.some((e) => e.report.clientName === "Old")).toBe(false);
  });

  it("reports failure when nothing fits, so the caller keeps the draft", () => {
    capStorageAt(1);
    expect(saveToHistory(report(), "share")).toBe(false);
  });
});
