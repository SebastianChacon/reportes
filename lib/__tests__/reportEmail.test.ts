import { describe, expect, it } from "vitest";
import {
  appOrigin,
  emailSubject,
  REPORT_LINK_PREFIX,
  reportEmailHtml,
  reportPath,
  reportUrl,
} from "../reportEmail";
import { submissionKey } from "../submission";
import { emptyReport, type JobReport } from "../types";

function report(over: Partial<JobReport> = {}): JobReport {
  return {
    ...emptyReport("en"),
    id: "r-1",
    date: "2026-08-07",
    clientName: "Riverside HOA",
    jobNumbers: ["4471"],
    truckNumbers: ["12"],
    startYard: "07:00",
    startJob: "07:40",
    endJob: "15:30",
    endYard: "16:10",
    lunchMinutes: 30,
    submittedAt: "2026-08-07T21:12:00.000Z",
    description: {
      original: "Cortamos el seto del frente.",
      originalLang: "es",
      translation: "Trimmed the front hedge.",
      translationLang: "en",
      unknownTerms: [],
      showingTranslation: false,
    },
    crew: [{ id: "p-1", name: "Carlos Ruiz", roles: ["FOR"], hours: 8, adhoc: false }],
    ...over,
  } as JobReport;
}

/**
 * The link is the point of the whole rework, and the thing that makes it
 * possible is that it does not need the Convex id — which does not exist when
 * the email is sent.
 */
describe("the link", () => {
  it("is keyed on the same submission key the phone files under", () => {
    const r = report();
    expect(reportPath(r)).toBe(`${REPORT_LINK_PREFIX}/${encodeURIComponent(submissionKey(r))}`);
  });

  it("survives a legacy key full of colons", () => {
    const legacy = report({ id: undefined });
    const path = reportPath(legacy);

    expect(submissionKey(legacy)).toContain(":");
    expect(path).not.toContain(":");
    // Decoding the last segment has to give the key back, or the page that
    // resolves it looks up something that was never filed.
    expect(decodeURIComponent(path.slice(REPORT_LINK_PREFIX.length + 1))).toBe(
      submissionKey(legacy)
    );
  });

  it("is absolute, so it survives leaving the building", () => {
    expect(reportUrl(report(), "https://reportes.backtonature.net")).toBe(
      `https://reportes.backtonature.net${reportPath(report())}`
    );
  });

  it("is null when there is nowhere to point", () => {
    expect(reportUrl(report(), null)).toBeNull();
  });
});

describe("appOrigin", () => {
  it("prefers the configured URL over whatever host the phone loaded", () => {
    expect(appOrigin("https://reportes.backtonature.net", "https://preview-xyz.vercel.app")).toBe(
      "https://reportes.backtonature.net"
    );
  });

  it("falls back to the request origin so no configuration is needed", () => {
    expect(appOrigin(undefined, "http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("strips a path off a configured URL rather than doubling it into the link", () => {
    expect(appOrigin("https://reportes.backtonature.net/office/", null)).toBe(
      "https://reportes.backtonature.net"
    );
  });

  it("falls through a malformed APP_URL instead of taking the send down", () => {
    expect(appOrigin("not a url", "https://reportes.backtonature.net")).toBe(
      "https://reportes.backtonature.net"
    );
  });

  it("refuses a non-http scheme, which is not something to put in a mail", () => {
    expect(appOrigin("javascript:alert(1)", null)).toBeNull();
    expect(appOrigin(undefined, null)).toBeNull();
  });
});

describe("emailSubject", () => {
  it("leads with the client and the date, which is all a phone shows", () => {
    expect(emailSubject(report())).toBe("Riverside HOA — 2026-08-07 · #4471 — Job report");
  });

  it("drops the job number when there is none rather than printing a stray hash", () => {
    expect(emailSubject(report({ jobNumbers: [] }))).toBe(
      "Riverside HOA — 2026-08-07 — Job report"
    );
  });
});

describe("reportEmailHtml", () => {
  const url = "https://reportes.backtonature.net/office/reportes/clave/r-1";

  it("puts the link in as a button and as readable text", () => {
    const html = reportEmailHtml({ report: report(), lang: "en", url });
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("Open in the console");
    // Spelled out too: a button whose destination cannot be seen is also how
    // phishing looks, and remote content is often blocked in a truck.
    expect(html.split(url).length - 1).toBeGreaterThanOrEqual(2);
  });

  it("says there is no console instead of drawing a button that goes nowhere", () => {
    const html = reportEmailHtml({ report: report(), lang: "en", url: null });
    expect(html).not.toContain("Open in the console");
    expect(html).toContain("no console wired up");
  });

  it("escapes a client name that contains markup", () => {
    const html = reportEmailHtml({
      report: report({ clientName: `<script>alert("x")</script>` }),
      lang: "en",
      url,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("shows the same flags the console will, from the same function", () => {
    const flagged = reportEmailHtml({
      report: report({ crew: [{ id: "p-1", name: "Carlos Ruiz", roles: [], hours: null, adhoc: false }] }),
      lang: "en",
      url,
    });
    expect(flagged).toContain("Missing hours");

    const clean = reportEmailHtml({ report: report(), lang: "en", url });
    expect(clean).not.toContain("Missing hours");
  });

  it("keeps what the foreman wrote above the translation, never instead of it", () => {
    const html = reportEmailHtml({ report: report(), lang: "en", url });
    const original = html.indexOf("Cortamos el seto del frente.");
    const translated = html.indexOf("Trimmed the front hedge.");
    expect(original).toBeGreaterThan(-1);
    expect(translated).toBeGreaterThan(original);
  });

  it("reports a crew member with no hours as missing, not as zero", () => {
    const html = reportEmailHtml({
      report: report({ crew: [{ id: "p-1", name: "Carlos Ruiz", roles: [], hours: null, adhoc: false }] }),
      lang: "en",
      url,
    });
    expect(html).toContain("no hours");
    expect(html).not.toMatch(/Carlos Ruiz[^<]*<[^>]*>\s*0\.0/);
  });

  it("reads catalog labels in the language the foreman filled the form in", () => {
    const withMaterial = report({
      materials: [
        {
          id: "m-1",
          label: { en: "Mulch", es: "Mantillo" },
          source: "BTN",
          qty: 4,
          cost: 25,
        },
      ],
    } as Partial<JobReport>);

    expect(reportEmailHtml({ report: withMaterial, lang: "es", url })).toContain("Mantillo");
    expect(reportEmailHtml({ report: withMaterial, lang: "en", url })).toContain("Mulch");
  });

  it("still speaks to the office in the console's language, whatever the form was filled in", () => {
    // The reader is a PM at a desk, not the man who sent it: the chrome is
    // CONSOLE_LANG even when the report came in Spanish.
    expect(reportEmailHtml({ report: report(), lang: "es", url })).toContain("Open in the console");
  });

  /**
   * A report replayed from an outbox written by an older build can be missing
   * whole arrays. The route normalizes those before it gets here, and it has to:
   * `crew` and `materials` are read by `lib/calc.ts`, which is deliberately not
   * defensive because every other caller has already been through the form.
   * Everything this module reads on its own account still tolerates the gap.
   */
  it("survives a report queued by an older build with arrays missing entirely", () => {
    const stale = {
      ...report(),
      photos: undefined,
      truckNumbers: undefined,
      jobNumbers: undefined,
    };
    expect(() =>
      reportEmailHtml({ report: stale as unknown as JobReport, lang: "en", url })
    ).not.toThrow();
  });
});
