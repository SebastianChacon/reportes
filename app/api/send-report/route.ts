import { NextResponse } from "next/server";
import { Resend } from "resend";
import type { JobReport, Lang } from "@/lib/types";
import { appOrigin, emailSubject, reportEmailHtml, reportUrl } from "@/lib/reportEmail";

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
    // can carry a description object that is missing individual keys, and the
    // email and the PDF both dereference `original` unconditionally.
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

  /**
   * The link back into the console.
   *
   * Built here rather than in the email module because only the request knows
   * where the app is answering from. `APP_URL` wins when it is set — a preview
   * deployment's hostname is gone in a week and this link is going to sit in
   * somebody's inbox — and the request's Origin is the fallback that makes it
   * work with no configuration. That fallback is only safe because `isSameOrigin`
   * above has already checked it against Host.
   *
   * Null when there is no console to open: without a Convex deployment nothing
   * is ever filed, so the report page would never resolve. The email says so
   * instead of showing a button that leads nowhere.
   */
  const origin = process.env.NEXT_PUBLIC_CONVEX_URL?.trim()
    ? appOrigin(process.env.APP_URL, request.headers.get("origin"))
    : null;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      // Comma-separated list in REPORT_TO_EMAIL sends to the whole office.
      to: to.split(",").map((address) => address.trim()).filter(Boolean),
      subject: emailSubject(report),
      html: reportEmailHtml({ report, lang: lang ?? "en", url: reportUrl(report, origin) }),
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
