import { afterEach, describe, expect, it, vi } from "vitest";
import { loadOutbox, queueReport, saveDraft } from "../storage";
import { emptyReport, type JobReport } from "../types";

/** A stand-in for a downscaled photo data URL — big enough to blow a quota. */
const PHOTO = `data:image/jpeg;base64,${"A".repeat(1024)}`;

function withPhotos(count: number): JobReport {
  return { ...emptyReport("en"), clientName: "Salazar", photos: Array(count).fill(PHOTO) };
}

/**
 * Simulates a full localStorage: `setItem` throws for anything over `limit`
 * characters, exactly as a browser does once the origin's quota is exhausted.
 */
function capStorageAt(limit: number) {
  const store = new Map<string, string>();
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    if (String(value).length > limit) throw new DOMException("quota", "QuotaExceededError");
    store.set(String(key), String(value));
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => store.get(String(key)) ?? null);
  return spy;
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("saveDraft under quota pressure", () => {
  it("reports a plain success when everything fits", () => {
    expect(saveDraft(withPhotos(1))).toBe("ok");
  });

  it("keeps the report but drops the photos rather than losing the autosave entirely", () => {
    // Room for the report, not for the photos.
    capStorageAt(3000);
    expect(saveDraft(withPhotos(20))).toBe("ok-without-photos");
  });

  it("reports failure when even the photoless report will not fit", () => {
    capStorageAt(1);
    expect(saveDraft(withPhotos(20))).toBe("failed");
  });
});

describe("queueReport under quota pressure", () => {
  it("confirms the report was persisted", () => {
    expect(queueReport(withPhotos(1))).toBe(true);
    expect(loadOutbox()).toHaveLength(1);
  });

  it("falls back to queueing without photos so the report is not silently dropped", () => {
    capStorageAt(3000);
    expect(queueReport(withPhotos(20))).toBe(true);
    const queued = loadOutbox();
    expect(queued).toHaveLength(1);
    expect(queued[0].report.photos).toEqual([]);
    expect(queued[0].report.clientName).toBe("Salazar");
  });

  it("returns false when nothing could be stored, so the caller can warn the foreman", () => {
    capStorageAt(1);
    expect(queueReport(withPhotos(20))).toBe(false);
  });
});
