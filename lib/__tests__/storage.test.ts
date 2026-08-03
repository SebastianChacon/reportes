import { beforeEach, describe, expect, it } from "vitest";
import { clearDraftIfUnchanged, loadDraft, saveDraft } from "../storage";
import { emptyReport, type JobReport } from "../types";

describe("clearDraftIfUnchanged", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("clears the draft when it still matches the sent report", () => {
    const report: JobReport = { ...emptyReport("en"), clientName: "Salazar" };
    saveDraft(report);

    const sent: JobReport = { ...report, submittedAt: "2026-08-03T12:00:00.000Z" };
    clearDraftIfUnchanged(sent);

    expect(loadDraft()).toBeNull();
  });

  it("does not clear the draft when the user has since started a different report", () => {
    const original: JobReport = { ...emptyReport("en"), clientName: "Salazar" };
    const sent: JobReport = { ...original, submittedAt: "2026-08-03T12:00:00.000Z" };

    // user pressed "Start Over" (or otherwise diverged) before the retry finished
    const newDraft: JobReport = { ...emptyReport("en"), clientName: "Different Client" };
    saveDraft(newDraft);

    clearDraftIfUnchanged(sent);

    expect(loadDraft()).toEqual(newDraft);
  });

  it("does nothing when there is no draft to clear", () => {
    const sent: JobReport = { ...emptyReport("en"), submittedAt: "2026-08-03T12:00:00.000Z" };
    expect(() => clearDraftIfUnchanged(sent)).not.toThrow();
    expect(loadDraft()).toBeNull();
  });
});
