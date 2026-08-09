import { buildPdf, pdfFileName } from "./pdf";
import { dayOfWeek } from "./i18n";
import type { JobReport, Lang } from "./types";

/** Where the report goes. Overridable per deployment without touching code. */
export const REPORT_TO =
  process.env.NEXT_PUBLIC_REPORT_TO_EMAIL?.trim() || "Esantander@backtonature.net";

/**
 * Decoded by hand rather than through `fetch(dataUrl)`, because the whole share
 * has to happen inside the click handler: iOS Safari drops the user-activation
 * that `navigator.share` requires as soon as you await anything.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const mime = /:(.*?);/.exec(header)?.[1] ?? "image/jpeg";
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** The PDF plus every photo, as files the OS share sheet can hand to Gmail or WhatsApp. */
export function buildReportFiles(report: JobReport, lang: Lang): File[] {
  const pdf = buildPdf(report, lang).output("blob") as Blob;
  const files = [new File([pdf], pdfFileName(report), { type: "application/pdf" })];

  report.photos.forEach((dataUrl, i) => {
    try {
      files.push(new File([dataUrlToBlob(dataUrl)], `foto-${i + 1}.jpg`, { type: "image/jpeg" }));
    } catch {
      /* a malformed photo must never cost the whole report */
    }
  });

  return files;
}

export function shareSubject(report: JobReport): string {
  return `Reporte de Trabajo — ${report.clientName} — ${report.date}${
    report.jobNumbers[0] ? ` — #${report.jobNumbers[0]}` : ""
  }`;
}

/** Short plain-text summary, so the message reads as a report even before the PDF is opened. */
export function shareBody(report: JobReport, lang: Lang): string {
  // Built as blocks rather than a flat list, so dropping an empty optional field
  // never also swallows the blank line that separates two sections.
  const header = [
    // First line on purpose: the share sheet cannot prefill a recipient, so this
    // is the only place the foreman can read the address off instead of
    // remembering it. It stays in the body even on the mailto path, where the
    // recipient is already filled in — a visible copy costs nothing.
    `Para: ${REPORT_TO}`,
    `Cliente: ${report.clientName}`,
    `Fecha: ${report.date} (${dayOfWeek(report.date, lang)})`,
    report.jobNumbers.length ? `Trabajo #: ${report.jobNumbers.join(", ")}` : null,
    report.truckNumbers.length ? `Camión #: ${report.truckNumbers.join(", ")}` : null,
    report.crew.length ? `Personal: ${report.crew.length}` : null,
  ].filter(Boolean);

  const footer = [
    report.photos.length ? `${report.photos.length} foto(s) adjunta(s).` : null,
    "Reporte completo en el PDF adjunto.",
  ].filter(Boolean);

  return [header.join("\n"), report.description.original, footer.join("\n")]
    .filter((block) => block.trim() !== "")
    .join("\n\n");
}

export type ShareOutcome = "shared" | "cancelled" | "unsupported";

/**
 * MUST be called directly from a click handler with no prior `await` — the
 * files are built synchronously above for exactly this reason.
 */
export async function shareReport(report: JobReport, lang: Lang): Promise<ShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }

  const files = buildReportFiles(report, lang);
  const payload = { files, title: shareSubject(report), text: shareBody(report, lang) };

  // Desktop browsers expose `share` but usually refuse file payloads.
  const canShare = navigator.canShare?.(payload) ?? false;
  const fallback = { title: payload.title, text: payload.text };

  try {
    await navigator.share(canShare ? payload : fallback);
    return "shared";
  } catch (err) {
    // The user backing out of the share sheet is a cancel, not a failure —
    // the report must stay on screen, untouched, so they can try again.
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

/** Last resort for desktop: prefill the mail client and hand over the PDF separately. */
export function mailtoUrl(report: JobReport, lang: Lang): string {
  const params = new URLSearchParams({
    subject: shareSubject(report),
    body: `${shareBody(report, lang)}\n\n(Adjunta el PDF descargado a este correo.)`,
  });
  return `mailto:${REPORT_TO}?${params.toString().replace(/\+/g, "%20")}`;
}
