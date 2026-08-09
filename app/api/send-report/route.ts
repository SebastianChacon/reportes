import { NextResponse } from "next/server";
import { Resend } from "resend";
import type { JobReport, Lang } from "@/lib/types";
import { formatHours, lunchMinutes, materialsTotalCost, onSiteHours, totalDayHours } from "@/lib/calc";
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
  if (typeof s !== "string") return "";
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
        `<li style="margin:2px 0">${escapeHtml(m.label?.[lang] ?? "")}${
          m.qty !== null ? ` ×${escapeHtml(String(m.qty))}` : ""
        } <span style="color:#71717a">(${m.source === "BTN" ? "BTN" : "other"})</span></li>`
    )
    .join("");

  const total = materialsTotalCost(r);
  const photoCount = r.photos?.length ?? 0;

  const stat = (label: string, value: string) =>
    `<td style="padding:4px" width="25%"><table style="border-collapse:collapse;width:100%;background:#f4f4f5;border-radius:10px" role="presentation"><tr><td style="padding:12px 8px;text-align:center">
      <div style="font-size:18px;font-weight:800;color:#18181b;line-height:1.1">${escapeHtml(value)}</div>
      <div style="margin-top:3px;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#71717a">${escapeHtml(
        label
      )}</div>
    </td></tr></table></td>`;

  const stats = [
    stat("Total hrs", formatHours(totalDayHours(r))),
    stat("On site", formatHours(onSiteHours(r))),
    stat("Crew", String(r.crew.length)),
    total > 0 ? stat("Materials", `$${total.toFixed(2)}`) : "",
  ]
    .filter(Boolean)
    .join("");

  return `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#18181b;background:#ffffff;max-width:640px;margin:0 auto;padding:24px">
  <table style="border-collapse:collapse;margin:0 0 4px"><tr>
    <td style="width:26px;height:26px;background:#111111;border-radius:5px;text-align:center;vertical-align:middle;font-size:8px;font-weight:800;letter-spacing:-.02em;color:#ffffff">BTN</td>
    <td style="padding-left:8px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#18181b">Back to Nature</td>
  </tr></table>
  <h1 style="margin:4px 0 2px;font-size:22px">Job Report — ${escapeHtml(r.clientName)}</h1>
  <p style="margin:0 0 18px;color:#71717a;font-size:14px">${escapeHtml(r.date)} · ${escapeHtml(
    dayOfWeek(r.date, lang)
  )} · Job ${r.jobNumbers.map((n) => `#${escapeHtml(n)}`).join(", ") || "—"}</p>

  <table style="border-collapse:collapse;width:100%;margin-bottom:16px" role="presentation"><tr>${stats}</tr></table>

  <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
    ${row("Client", r.clientName)}
    ${row("Job #", r.jobNumbers.join(", "))}
    ${row("Truck #", r.truckNumbers.join(", "))}
    ${row("Yard → Job", `${r.startYard || "—"} → ${r.startJob || "—"}`)}
    ${row("Job → Yard", `${r.endJob || "—"} → ${r.endYard || "—"}`)}
    ${row("Lunch", `${lunchMinutes(r)} min`)}
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

  <table style="border-collapse:collapse;width:100%;margin-top:28px;border-top:1px solid #e4e4e7" role="presentation">
    <tr>
      <td style="padding-top:14px;font-size:12px;color:#71717a;vertical-align:top">
        📄 <strong style="color:#18181b">Full report</strong> — attached as a one-page PDF.
      </td>
      <td style="padding-top:14px;font-size:12px;color:#71717a;vertical-align:top;text-align:right">
        ${
          photoCount > 0
            ? `📷 <strong style="color:#18181b">${photoCount} photo(s)</strong> — attached separately as images.`
            : "No photos attached."
        }
      </td>
    </tr>
  </table>
  <p style="margin-top:10px;font-size:11px;color:#a1a1aa">
    Submitted ${escapeHtml(
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""
    )} from the mobile job report app.
  </p>
</div>`.trim();
}

/** Extracts the domain from a bare address or a `Name <addr@host>` header. */
function domainOf(address: string): string {
  const bare = address.includes("<") ? address.slice(address.indexOf("<") + 1, address.indexOf(">")) : address;
  return bare.split("@")[1]?.trim().toLowerCase() ?? "";
}

/**
 * RFC 2606 reserves these for documentation — they can never be verified as a
 * Resend sending domain, so a placeholder left in REPORT_FROM_EMAIL turns every
 * send into an opaque 403. Catch it here and say what is actually wrong.
 */
const RESERVED_DOMAINS = ["example", "invalid", "test", "localhost"];

/**
 * Only this app may post here. Without the check, anyone who finds the URL can
 * send 8MB PDFs and 20MB of photos from the company's verified sending domain.
 *
 * A missing Origin (curl, a server-to-server call) is refused rather than
 * waved through: every legitimate caller is a browser doing a same-origin fetch.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** One report a foreman writes in a day; a dozen an hour is already abuse. */
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Per-instance and in-memory, so it is a speed bump rather than a wall: Fluid
 * Compute reuses instances, but a burst spread across enough cold starts still
 * gets through. It costs nothing and closes the trivial case; a shared counter
 * (Upstash, Vercel Firewall rate limiting) is the real fix if this is ever
 * exposed to more than the crew.
 */
const recentSends = new Map<string, number[]>();

export function rateLimited(key: string, now: number = Date.now()): boolean {
  const hits = (recentSends.get(key) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    recentSends.set(key, hits);
    return true;
  }
  recentSends.set(key, [...hits, now]);
  // Stop the map from growing without bound on a long-lived instance.
  if (recentSends.size > 500) {
    for (const [k, v] of recentSends) {
      if (v.every((at) => now - at >= RATE_WINDOW_MS)) recentSends.delete(k);
    }
  }
  return false;
}

export function isPlaceholderSender(from: string): boolean {
  const domain = domainOf(from);
  if (!domain) return true;
  const tld = domain.split(".").pop() ?? "";
  return RESERVED_DOMAINS.includes(tld) || domain === "example.com";
}

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "forbidden", permanent: true }, { status: 403 });
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited", permanent: false }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_TO_EMAIL;
  const from = process.env.REPORT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    // Not configured — tell the client so it can fall back to "download PDF".
    const absent = [
      !apiKey && "RESEND_API_KEY",
      !to && "REPORT_TO_EMAIL",
      !from && "REPORT_FROM_EMAIL",
    ].filter(Boolean);
    console.error(`send-report not configured — missing ${absent.join(", ")}`);
    return NextResponse.json(
      {
        error: "email_not_configured",
        permanent: true,
        hint: `Missing ${absent.join(", ")} in this environment`,
      },
      { status: 503 }
    );
  }

  if (isPlaceholderSender(from)) {
    console.error(
      `send-report misconfigured — REPORT_FROM_EMAIL is "${from}", a reserved domain that Resend can never verify.`
    );
    return NextResponse.json(
      {
        error: "email_not_configured",
        permanent: true,
        hint: `REPORT_FROM_EMAIL is set to the placeholder "${from}". Point it at an address on a domain verified at https://resend.com/domains`,
      },
      { status: 503 }
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { report: rawReport, lang, pdfBase64, fileName, photos = [] } = payload ?? {};
  if (!rawReport?.clientName || !rawReport?.date || !pdfBase64) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Reports can sit in the client's draft/outbox localStorage across app updates, so a
  // queued report may predate a schema change and be missing newer array fields entirely.
  const arr = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  // The body is JSON from a client we do not control, so a "number" may arrive
  // as a string or NaN. `formatHours` calls `.toFixed` on whatever it gets and
  // `materialsTotalCost` sums it — one bad field would 500 the whole send.
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const report: JobReport = {
    ...rawReport,
    startYard: str(rawReport.startYard),
    startJob: str(rawReport.startJob),
    endJob: str(rawReport.endJob),
    endYard: str(rawReport.endYard),
    // A report queued before lunch existed has no break at all — defaulting it
    // to 30 here would shave half an hour off hours that were already agreed.
    lunchMinutes: typeof rawReport.lunchMinutes === "number" ? rawReport.lunchMinutes : 0,
    notes: str(rawReport.notes),
    clientName: str(rawReport.clientName),
    jobNumbers: arr(rawReport.jobNumbers),
    truckNumbers: arr(rawReport.truckNumbers),
    crew: arr(rawReport.crew).map((c) => ({ ...c, name: str(c?.name), hours: num(c?.hours) })),
    materials: arr(rawReport.materials).map((m) => ({
      ...m,
      qty: num(m?.qty),
      cost: num(m?.cost),
    })),
    plants: arr(rawReport.plants).map((p) => ({ ...p, qty: num(p?.qty), cost: num(p?.cost) })),
    equipment: arr(rawReport.equipment),
    subcontractors: arr(rawReport.subcontractors),
    trucks: arr(rawReport.trucks),
    photos: arr(rawReport.photos),
    // Spelled out field by field rather than spread over a default: an old draft
    // can carry a description object that is missing individual keys, and
    // summaryHtml and the PDF both dereference `original` unconditionally.
    description: {
      original: str(rawReport.description?.original),
      originalLang: rawReport.description?.originalLang ?? lang ?? "en",
      translation: rawReport.description?.translation ?? null,
      translationLang: rawReport.description?.translationLang ?? null,
      unknownTerms: arr(rawReport.description?.unknownTerms),
      showingTranslation: rawReport.description?.showingTranslation ?? false,
    },
  };
  if (pdfBase64.length * 0.75 > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "pdf_too_large", permanent: true }, { status: 413 });
  }
  const photosBytes = photos.reduce((sum, p) => sum + p.length * 0.75, 0);
  if (photosBytes > MAX_PHOTOS_BYTES) {
    return NextResponse.json({ error: "photos_too_large", permanent: true }, { status: 413 });
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
      // A rejected sender, an unverified domain or a bad key will be rejected
      // identically on every retry — queuing those in the outbox just hides a
      // config problem behind "try again when you have signal".
      const PERMANENT_RESEND_ERRORS = [
        "validation_error", // unverified sending domain — the usual culprit
        "invalid_from_address",
        "invalid_access",
        "invalid_parameter",
        "invalid_api_Key", // Resend's own spelling
        "missing_api_key",
        "missing_required_field",
      ];
      const permanent = PERMANENT_RESEND_ERRORS.includes(error.name);
      return NextResponse.json(
        { error: "send_failed", permanent, hint: error.message },
        { status: permanent ? 422 : 502 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("send-report failed", err);
    // Network/timeout against Resend — genuinely worth another try later.
    return NextResponse.json({ error: "send_failed", permanent: false }, { status: 502 });
  }
}
