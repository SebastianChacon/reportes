import { beforeEach, describe, expect, it, vi } from "vitest";
import { fileReport, type FilingBackend } from "../filing";
import {
  loadHistory,
  loadUnfiledHistory,
  markHistoryFiled,
  saveToHistory,
} from "../storage";
import { emptyReport, type JobReport } from "../types";

function report(over: Partial<JobReport> = {}): JobReport {
  return {
    ...emptyReport("es"),
    date: "2026-08-07",
    clientName: "Salazar",
    jobNumbers: ["21550"],
    startYard: "07:00",
    startJob: "07:35",
    endJob: "16:00",
    endYard: "16:30",
    crew: [{ id: "aguilar-miguel", name: "Aguilar, Miguel", roles: ["F"], hours: 9 }],
    description: { ...emptyReport("es").description, original: "Bluestone edge." },
    ...over,
  };
}

/** Records the order calls arrive in, which is the thing that actually matters. */
function fakeBackend(over: Partial<FilingBackend> = {}) {
  const calls: string[] = [];
  const backend: FilingBackend = {
    uploadPhoto: vi.fn(async (dataUrl: string) => {
      calls.push(`upload:${dataUrl.slice(-3)}`);
      return `storage-${dataUrl.slice(-3)}`;
    }),
    submit: vi.fn(async () => {
      calls.push("submit");
      return { duplicate: false };
    }),
    ...over,
  };
  return { backend, calls };
}

describe("fileReport", () => {
  it("does nothing at all when no deployment is configured", async () => {
    expect(await fileReport(report(), null)).toBe("unconfigured");
  });

  it("files the report and reports success", async () => {
    const { backend } = fakeBackend();
    expect(await fileReport(report(), backend)).toBe("filed");
    expect(backend.submit).toHaveBeenCalledOnce();
  });

  it("uploads every photo before writing the report that points at them", async () => {
    // A report row appears in the office's day board the moment it is written.
    // One that arrives while its photos are still uploading reads as a report
    // filed without photos.
    const { backend, calls } = fakeBackend();
    const withPhotos = report({
      photos: ["data:image/jpeg;base64,AAA", "data:image/jpeg;base64,BBB"],
    });

    await fileReport(withPhotos, backend);

    expect(calls).toEqual(["upload:AAA", "upload:BBB", "submit"]);
  });

  it("hands the storage ids to submit in the order the photos were taken", async () => {
    const { backend } = fakeBackend();
    await fileReport(
      report({ photos: ["data:image/jpeg;base64,AAA", "data:image/jpeg;base64,BBB"] }),
      backend
    );

    expect(backend.submit).toHaveBeenCalledWith(
      expect.objectContaining({ photoStorageIds: ["storage-AAA", "storage-BBB"] })
    );
  });

  it("uploads nothing for a report filed without photos", async () => {
    const { backend, calls } = fakeBackend();
    await fileReport(report({ photos: [] }), backend);

    expect(calls).toEqual(["submit"]);
    expect(backend.uploadPhoto).not.toHaveBeenCalled();
  });

  it("passes the fanned-out crew rows alongside the report", async () => {
    const { backend } = fakeBackend();
    await fileReport(report(), backend);

    expect(backend.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        crewDays: [expect.objectContaining({ personId: "aguilar-miguel", date: "2026-08-07" })],
      })
    );
  });

  it("treats an already-filed report as a success, not a retry", async () => {
    const { backend } = fakeBackend({ submit: vi.fn(async () => ({ duplicate: true })) });
    expect(await fileReport(report(), backend)).toBe("duplicate");
  });

  it("gives up quietly when the phone is offline", async () => {
    const { backend } = fakeBackend({
      submit: vi.fn(async () => {
        throw new Error("Failed to fetch");
      }),
    });
    expect(await fileReport(report(), backend)).toBe("failed");
  });

  it("never writes the report when a photo upload fails", async () => {
    // Otherwise the office gets a report claiming four photos and holding none.
    const { backend } = fakeBackend({
      uploadPhoto: vi.fn(async () => {
        throw new Error("upload_failed");
      }),
    });

    const result = await fileReport(report({ photos: ["data:image/jpeg;base64,AAA"] }), backend);

    expect(result).toBe("failed");
    expect(backend.submit).not.toHaveBeenCalled();
  });

  it("survives a report replayed from a build that had no photos field", async () => {
    const { backend } = fakeBackend();
    const legacy = report();
    delete (legacy as { photos?: string[] }).photos;

    expect(await fileReport(legacy, backend)).toBe("filed");
  });
});

describe("history as the filing queue", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists a freshly sent report as still unfiled", () => {
    saveToHistory(report({ submittedAt: "2026-08-07T20:41:00.000Z" }), "share");

    const unfiled = loadUnfiledHistory();
    expect(unfiled).toHaveLength(1);
    expect(unfiled[0].filedAt).toBeUndefined();
  });

  it("stops listing it once the office has it", () => {
    saveToHistory(report({ submittedAt: "2026-08-07T20:41:00.000Z" }), "share");
    const [entry] = loadHistory();

    markHistoryFiled(entry.id, "2026-08-07T20:42:00.000Z");

    expect(loadUnfiledHistory()).toEqual([]);
    expect(loadHistory()[0].filedAt).toBe("2026-08-07T20:42:00.000Z");
  });

  it("leaves the rest of the entry untouched when marking it filed", () => {
    saveToHistory(report({ submittedAt: "2026-08-07T20:41:00.000Z" }), "share");
    const before = loadHistory()[0];

    markHistoryFiled(before.id);
    const after = loadHistory()[0];

    expect(after.report).toEqual(before.report);
    expect(after.via).toBe("share");
    expect(after.sentAt).toBe(before.sentAt);
  });

  it("marks only the entry asked for", () => {
    saveToHistory(report({ clientName: "Salazar", submittedAt: "2026-08-07T10:00:00.000Z" }), "share");
    saveToHistory(report({ clientName: "Whitmore", submittedAt: "2026-08-07T18:00:00.000Z" }), "share");

    const [newest] = loadHistory();
    markHistoryFiled(newest.id);

    const unfiled = loadUnfiledHistory();
    expect(unfiled).toHaveLength(1);
    expect(unfiled[0].report.clientName).toBe("Salazar");
  });

  it("backfills reports that were sent before filing existed", () => {
    // Entries written by the previous build carry no `filedAt`, and the office
    // wants exactly those two weeks of work on the day it switches on.
    saveToHistory(report({ submittedAt: "2026-08-01T12:00:00.000Z" }), "share");
    saveToHistory(report({ submittedAt: "2026-08-02T12:00:00.000Z" }), "email");

    expect(loadUnfiledHistory()).toHaveLength(2);
  });

  it("does nothing when asked to mark an entry that is gone", () => {
    saveToHistory(report({ submittedAt: "2026-08-07T20:41:00.000Z" }), "share");

    expect(() => markHistoryFiled("no-such-entry")).not.toThrow();
    expect(loadUnfiledHistory()).toHaveLength(1);
  });
});
