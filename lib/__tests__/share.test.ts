import { describe, expect, it } from "vitest";
import { mailtoUrl, REPORT_TO, shareBody, shareSubject } from "../share";
import { emptyReport, type JobReport } from "../types";

function report(over: Partial<JobReport> = {}): JobReport {
  return {
    ...emptyReport("es"),
    date: "2026-08-04",
    clientName: "Salazar",
    jobNumbers: ["21550"],
    description: {
      original: "Instalacion de plantas",
      originalLang: "es",
      translation: null,
      translationLang: null,
      unknownTerms: [],
      showingTranslation: false,
    },
    ...over,
  };
}

describe("shareSubject", () => {
  it("identifies the report at a glance in the mail list", () => {
    expect(shareSubject(report())).toBe("Reporte de Trabajo — Salazar — 2026-08-04 — #21550");
  });

  it("omits the job number when there is none", () => {
    expect(shareSubject(report({ jobNumbers: [] }))).toBe("Reporte de Trabajo — Salazar — 2026-08-04");
  });
});

describe("shareBody", () => {
  it("separates the header, the description and the footer with blank lines", () => {
    const body = shareBody(report(), "es");
    expect(body).toContain("Cliente: Salazar");
    expect(body).toContain("\n\nInstalacion de plantas\n\n");
    expect(body).toContain("Reporte completo en el PDF adjunto.");
  });

  it("keeps those blank lines even when every optional field is absent", () => {
    // Dropping empty optional fields must not also swallow the separators.
    const body = shareBody(report({ jobNumbers: [], truckNumbers: [], crew: [] }), "es");
    expect(body).toContain("\n\nInstalacion de plantas\n\n");
    expect(body).not.toContain("Trabajo #:");
    expect(body).not.toMatch(/\n\n\n/);
  });

  it("mentions the photo count only when photos are attached", () => {
    expect(shareBody(report(), "es")).not.toContain("foto(s)");
    expect(shareBody(report({ photos: ["data:image/jpeg;base64,AAAA"] }), "es")).toContain(
      "1 foto(s) adjunta(s)."
    );
  });
});

describe("mailtoUrl", () => {
  it("prefills the recipient and subject for the desktop fallback", () => {
    const url = mailtoUrl(report(), "es");
    expect(url.startsWith(`mailto:${REPORT_TO}?`)).toBe(true);
    expect(url).toContain("subject=");
    expect(decodeURIComponent(url)).toContain("Salazar");
  });

  it("encodes spaces as %20 rather than +, which mail clients render literally", () => {
    expect(mailtoUrl(report(), "es")).not.toContain("+");
  });
});
