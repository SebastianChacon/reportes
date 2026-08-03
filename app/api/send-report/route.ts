import { NextResponse } from "next/server";
import { Resend } from "resend";
import type { JobReport, Lang } from "@/lib/types";
import { crewTotalHours, formatHours, materialsTotalCost, onSiteHours, totalDayHours } from "@/lib/calc";
import { dayOfWeek } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Signatures are PNGs, so payloads are chunky — but not unbounded. */
const MAX_PDF_BYTES = 8 * 1024 * 1024;
/** Photos are downscaled client-side, but a dozen of them still add up. */
const MAX_PHOTOS_BYTES = 20 * 1024 * 1024;

type Payload = {
  report: JobReport;
  lang: Lang;
  pdfBase64: string;
  fileName: string;
  /** base64 JPEGs, prefix already stripped client-side. */
  photos?: string[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summaryHtml(r: JobReport, lang: Lang): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap">${escapeHtml(
      k
    )}</td><td style="padding:6px 0;font-size:15px;font-weight:600">${escapeHtml(v || "—")}</td></tr>`;

  const crewRows = r.crew
    .map(
      (c) =>
        `<li style="margin:2px 0">${escapeHtml(c.name)} — <strong>${formatHours(c.hours)} hrs</strong>${
          c.adhoc ? ' <span style="color:#ea580c">*</span>' : ""
        }</li>`
    )
    .join("");

  const materialsRows = r.materials
    .map(
      (m) =>
        `<li style="margin:2px 0">${escapeHtml(m.label[lang])}${
          m.qty !== null ? ` ×${m.qty}` : ""
        } <span style="color:#71717a">(${m.source === "BTN" ? "BTN" : "other"})</span></li>`
    )
    .join("");

  const total = materialsTotalCost(r);

  return `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#18181b;max-width:640px;margin:0 auto;padding:24px">
  <table style="border-collapse:collapse;margin:0 0 4px"><tr>
    <td style="width:26px;height:26px;background:#111111;border-radius:5px;text-align:center;vertical-align:middle;font-size:8px;font-weight:800;letter-spacing:-.02em;color:#ffffff">BTN</td>
    <td style="padding-left:8px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#18181b">Back to Nature</td>
  </tr></table>
  <h1 style="margin:4px 0 2px;font-size:22px">Job Report — ${escapeHtml(r.clientName)}</h1>
  <p style="margin:0 0 20px;color:#71717a;font-size:14px">${escapeHtml(r.date)} · ${escapeHtml(
    dayOfWeek(r.date, lang)
  )} · Job ${r.jobNumbers.map((n) => `#${escapeHtml(n)}`).join(", ") || "—"}</p>

  <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
    ${row("Client", r.clientName)}
    ${row("Job #", r.jobNumbers.join(", "))}
    ${row("Truck #", r.truckNumbers.join(", "))}
    ${row("Yard → Job", `${r.startYard || "—"} → ${r.startJob || "—"}`)}
    ${row("Job → Yard", `${r.endJob || "—"} → ${r.endYard || "—"}`)}
    ${row("Total hours", formatHours(totalDayHours(r)))}
    ${row("On site", formatHours(onSiteHours(r)))}
    ${row("Crew hours", `${formatHours(crewTotalHours(r))} (${r.crew.length} people)`)}
    ${total > 0 ? row("Materials cost", `$${total.toFixed(2)}`) : ""}
  </table>

  <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#18181b;border-bottom:1px solid #18181b;padding-bottom:4px">Description</h2>
  <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(r.description.original)}</p>
  ${
    r.description.translation
      ? `<p style="font-size:14px;line-height:1.6;color:#71717a;font-style:italic;white-space:pre-wrap;border-top:1px solid #e4e4e7;padding-top:10px"><strong style="font-style:normal;text-transform:uppercase">${escapeHtml(
          r.description.translationLang ?? ""
        )}</strong> ${escapeHtml(r.description.translation)}</p>`
      : ""
  }

  ${
    crewRows
      ? `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#18181b;border-bottom:1px solid #18181b;padding-bottom:4px;margin-top:24px">Crew</h2><ul style="font-size:14px;padding-left:18px;margin:8px 0">${crewRows}</ul>`
      : ""
  }
  ${
    materialsRows
      ? `<h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#18181b;border-bottom:1px solid #18181b;padding-bottom:4px;margin-top:24px">Materials</h2><ul style="font-size:14px;padding-left:18px;margin:8px 0">${materialsRows}</ul>`
      : ""
  }
  ${r.notes ? `<p style="font-size:14px;margin-top:20px"><strong>Notes:</strong> ${escapeHtml(r.notes)}</p>` : ""}
  ${
    r.photos?.length
      ? `<p style="font-size:14px;margin-top:10px"><strong>${r.photos.length}</strong> photo(s) attached.</p>`
      : ""
  }

  <p style="margin-top:28px;font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:12px">
    Full report attached as PDF. Submitted ${escapeHtml(
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""
    )} from the mobile job report app.
  </p>
</div>`.trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_TO_EMAIL;
  const from = process.env.REPORT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    // Not configured — tell the client so it can fall back to "download PDF".
    return NextResponse.json(
      { error: "email_not_configured", hint: "Set RESEND_API_KEY, REPORT_TO_EMAIL and REPORT_FROM_EMAIL" },
      { status: 503 }
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { report, lang, pdfBase64, fileName, photos = [] } = payload ?? {};
  if (!report?.clientName || !report?.date || !pdfBase64) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (pdfBase64.length * 0.75 > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "pdf_too_large" }, { status: 413 });
  }
  const photosBytes = photos.reduce((sum, p) => sum + p.length * 0.75, 0);
  if (photosBytes > MAX_PHOTOS_BYTES) {
    return NextResponse.json({ error: "photos_too_large" }, { status: 413 });
  }

  const subject = `Job Report — ${report.clientName} — ${report.date}${
    report.jobNumbers[0] ? ` — #${report.jobNumbers[0]}` : ""
  }`;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      // Comma-separated list in REPORT_TO_EMAIL sends to the whole office.
      to: to.split(",").map((address) => address.trim()).filter(Boolean),
      subject,
      html: summaryHtml(report, lang ?? "en"),
      attachments: [
        { filename: fileName || "job-report.pdf", content: pdfBase64 },
        ...photos.map((content, i) => ({ filename: `photo-${i + 1}.jpg`, content })),
      ],
    });

    if (error) {
      console.error("resend error", error);
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("send-report failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
