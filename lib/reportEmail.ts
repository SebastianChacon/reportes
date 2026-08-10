import {
  formatHours,
  lunchMinutes,
  materialsTotalCost,
  onSiteHours,
  totalDayHours,
} from "./calc";
import { CONSOLE_LANG, dayOfWeek, tc, tcf, type ConsoleKey } from "./i18n";
import { money, moneyExact } from "./officeFormat";
import { reportFlags, submissionKey } from "./submission";
import type { JobReport, Lang } from "./types";

/**
 * The email the office gets when a foreman sends a report.
 *
 * Pulled out of the API route so it can be read and tested without a Resend key
 * — and because what it is changed into here is not a formatting tweak. Until
 * now this email *was* the record: a PDF and a wall of numbers, filed by
 * whoever happened to read it. With a console behind it, the email's job is to
 * be a **notification** — enough of the day to judge whether it needs attention
 * right now, and one link to the place where something can be done about it.
 *
 * Three constraints shape everything below, and none of them are negotiable in
 * an inbox:
 *
 * 1. **Tables and inline styles only.** Gmail strips `<style>` blocks and every
 *    client ignores CSS custom properties, so the console's tokens are copied
 *    here as literal hex rather than referenced. `EMAIL` below is that copy, and
 *    the comment on it is the reason it is allowed to exist.
 * 2. **Nothing is recomputed that was already computed.** The totals here come
 *    from `lib/calc.ts`, the same functions that produced the PDF attached to
 *    this very message and the numbers `lib/submission.ts` will store. Three
 *    copies of the same day that disagree are worth less than one.
 * 3. **The link may not exist.** No Convex deployment, or a report the phone
 *    never managed to file, means there is nothing to open — and a button that
 *    lands on "not here" is worse than no button. It is omitted instead.
 */

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

/**
 * The console's `[data-surface="office"]` palette, written out.
 *
 * A copy, deliberately: `app/globals.css` declares these as custom properties,
 * and no email client resolves `var()`. Light values only — an email that tried
 * to follow the reader's dark mode would be rewritten by Gmail and inverted by
 * Outlook, in different directions, and end up unreadable in both.
 */
const EMAIL = {
  surface: "#ffffff",
  sunk: "#f6f6f5",
  ink: "#16150f",
  muted: "#5f5d55",
  line: "#e0dfd9",
  accent: "#16150f",
  accentContrast: "#ffffff",
  warn: "#8a4b12",
  warnSoft: "#fbeee1",
} as const;

const FONT = `ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

/* ------------------------------------------------------------------ */
/* The link                                                            */
/* ------------------------------------------------------------------ */

/**
 * Where an emailed report link points.
 *
 * A separate segment from `/office/reportes/[id]` because it is a different
 * identifier: that route takes a Convex document id, and this one takes the key
 * the phone made up before the document existed. Overloading one route with two
 * id spaces would mean a mangled link asking Convex to parse a clientId as an
 * id, which is exactly the crash the report page already guards against.
 */
export const REPORT_LINK_PREFIX = "/office/reportes/clave";

export function reportPath(report: JobReport): string {
  return `${REPORT_LINK_PREFIX}/${encodeURIComponent(submissionKey(report))}`;
}

/**
 * The origin to build an absolute link from, or null if there is none to trust.
 *
 * `configured` is `APP_URL` and wins whenever it is set: the request origin is
 * whatever host the foreman's phone happened to load, which on a preview
 * deployment is a URL that will be gone in a week — and this link is going into
 * somebody's inbox to be clicked next month.
 *
 * Falling back to the request origin is what makes the link work with no
 * configuration at all. That is safe here only because the caller has already
 * checked the Origin header against Host (`isSameOrigin`); an unvalidated
 * origin would let a caller choose where the office's mail points.
 */
export function appOrigin(
  configured: string | undefined,
  requestOrigin: string | null
): string | null {
  for (const candidate of [configured?.trim(), requestOrigin?.trim()]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      return url.origin;
    } catch {
      // A malformed APP_URL falls through to the request origin rather than
      // taking the whole send down with it.
    }
  }
  return null;
}

/** The absolute link for this report, or null when there is nowhere to point. */
export function reportUrl(report: JobReport, origin: string | null): string | null {
  return origin === null ? null : `${origin}${reportPath(report)}`;
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

export function escapeHtml(s: unknown): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The console's flag vocabulary, so a chip reads the same in both places. */
const FLAG_LABEL: Record<string, ConsoleKey> = {
  warnLongDay: "flagLongDay",
  warnNoCrew: "flagNoCrew",
  warnNoHours: "flagNoHours",
};

/**
 * The subject line.
 *
 * Front-loaded with the client and the date because a phone's notification
 * shows about forty characters and then stops. "Job Report —" first would spend
 * all of them saying what every one of these messages says.
 */
export function emailSubject(report: JobReport): string {
  const job = report.jobNumbers?.[0] ? ` · #${report.jobNumbers[0]}` : "";
  return `${report.clientName} — ${report.date}${job} — ${tc("emailSubjectTag")}`;
}

/**
 * The line the inbox shows next to the subject before anything is opened.
 *
 * Without one, every client picks the first text in the body, which here is the
 * company name — the same for every message, and so worth nothing. Hidden in
 * the body itself by the usual trick: zero size, transparent, clipped.
 */
function preheader(report: JobReport, flagged: boolean): string {
  const parts = [
    tcf("emailPreheaderCrew", { n: report.crew?.length ?? 0 }),
    `${formatHours(totalDayHours(report))} ${tc("hours")}`,
  ];
  if (flagged) parts.push(tc("emailNeedsALook"));
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">${escapeHtml(
    parts.join(" · ")
  )}</div>`;
}

function statCell(label: string, value: string): string {
  return `<td style="padding:3px" width="25%" valign="top"><table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:${EMAIL.sunk};border:1px solid ${EMAIL.line};border-radius:10px"><tr><td style="padding:12px 6px;text-align:center">
    <div style="font-size:19px;font-weight:800;color:${EMAIL.ink};line-height:1.1">${escapeHtml(
      value
    )}</div>
    <div style="margin-top:4px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${
      EMAIL.muted
    }">${escapeHtml(label)}</div>
  </td></tr></table></td>`;
}

/**
 * The four numbers, in the same order and with the same words as the day board
 * at the top of `/office`. A PM who reads one and then the other should not
 * have to work out that "Total hrs" and "Labour hours" were the same column.
 */
function statsRow(report: JobReport): string {
  const cost = materialsTotalCost(report);
  const cells = [
    statCell(tc("dayHours"), formatHours(totalDayHours(report))),
    statCell(tc("onSite"), formatHours(onSiteHours(report))),
    statCell(tc("sectionCrew"), String(report.crew?.length ?? 0)),
    // Rounded, like the day board it mirrors — cents are noise at a glance, and
    // the line items further down carry them to the penny for reconciling.
    cost > 0 ? statCell(tc("materialsSpend"), money(cost)) : "",
  ].filter(Boolean);

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 18px"><tr>${cells.join(
    ""
  )}</tr></table>`;
}

/**
 * The warnings the phone already raised, at the top rather than at the bottom.
 *
 * These are the reason a report gets opened today instead of on Friday, so they
 * sit above the fold with the link. Read from `reportFlags`, which is the same
 * function that decides whether the stored report starts life in the review
 * queue — the email and the console cannot flag different things.
 */
function flagsRow(report: JobReport): string {
  const chips = reportFlags(report)
    .filter((flag) => flag.key in FLAG_LABEL)
    .map(
      (flag) =>
        `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border:1px solid ${
          EMAIL.warn
        };border-radius:999px;background:${EMAIL.warnSoft};color:${
          EMAIL.warn
        };font-size:12px;font-weight:700">&#9888;&#65039; ${escapeHtml(
          tc(FLAG_LABEL[flag.key])
        )}</span>`
    )
    .join("");

  return chips ? `<div style="margin:0 0 14px">${chips}</div>` : "";
}

/**
 * The button, and the same URL spelled out underneath it.
 *
 * The plain URL is not clutter. Half of these are read on a phone in a truck,
 * where a mail client may be blocking remote content or the reader may want to
 * forward the link to somebody rather than follow it — and a button whose
 * destination cannot be seen is also how phishing looks.
 */
function linkBlock(url: string | null): string {
  if (url === null) {
    return `<p style="margin:0 0 18px;padding:12px 14px;background:${EMAIL.sunk};border:1px solid ${EMAIL.line};border-radius:10px;font-size:13px;color:${EMAIL.muted}">${escapeHtml(
      tc("emailNoConsole")
    )}</p>`;
  }

  const safe = escapeHtml(url);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px">
    <tr><td style="background:${EMAIL.accent};border-radius:10px">
      <a href="${safe}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;color:${
        EMAIL.accentContrast
      };text-decoration:none">${escapeHtml(tc("emailOpenInConsole"))} &rarr;</a>
    </td></tr>
  </table>
  <p style="margin:0 0 18px;font-size:11px;color:${EMAIL.muted};word-break:break-all">${safe}</p>`;
}

function factsTable(report: JobReport): string {
  const row = (key: string, value: string) =>
    `<tr>
      <td style="padding:7px 14px 7px 0;border-bottom:1px solid ${EMAIL.line};color:${
        EMAIL.muted
      };font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;vertical-align:top">${escapeHtml(
        key
      )}</td>
      <td style="padding:7px 0;border-bottom:1px solid ${EMAIL.line};font-size:14px;font-weight:600;color:${
        EMAIL.ink
      }">${escapeHtml(value || "—")}</td>
    </tr>`;

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 22px">
    ${row(tc("sectionJob"), report.jobNumbers?.join(", ") ?? "")}
    ${row(tc("trucks"), report.truckNumbers?.join(", ") ?? "")}
    ${row(tc("emailYardToJob"), `${report.startYard || "—"} → ${report.startJob || "—"}`)}
    ${row(tc("emailJobToYard"), `${report.endJob || "—"} → ${report.endYard || "—"}`)}
    ${row(tc("lunch"), `${lunchMinutes(report)} min`)}
  </table>`;
}

function heading(text: string): string {
  return `<h2 style="margin:24px 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:${EMAIL.muted};border-bottom:1px solid ${EMAIL.line};padding-bottom:5px">${escapeHtml(
    text
  )}</h2>`;
}

function descriptionBlock(report: JobReport): string {
  const original = `<p style="margin:0;font-size:15px;line-height:1.6;color:${EMAIL.ink};white-space:pre-wrap">${escapeHtml(
    report.description?.original
  )}</p>`;

  // The translation is shown under the original, never instead of it: what the
  // foreman actually wrote is the record, and the translation is a convenience.
  const translated = report.description?.translation
    ? `<p style="margin:10px 0 0;padding-top:10px;border-top:1px solid ${EMAIL.line};font-size:14px;line-height:1.6;color:${
        EMAIL.muted
      };white-space:pre-wrap"><strong style="text-transform:uppercase;font-size:10px;letter-spacing:.06em">${escapeHtml(
        report.description.translationLang ?? ""
      )}</strong> ${escapeHtml(report.description.translation)}</p>`
    : "";

  return heading(tc("sectionWork")) + original + translated;
}

function crewBlock(report: JobReport): string {
  const rows = (report.crew ?? [])
    .map((member) => {
      // Nobody wrote the hours down, which is not the same fact as zero hours —
      // and it is the single most common reason a report gets sent back.
      const hours =
        member.hours === null || member.hours === undefined
          ? `<span style="color:${EMAIL.warn};font-weight:700">${escapeHtml(tc("noHoursRecorded"))}</span>`
          : `<strong>${escapeHtml(formatHours(member.hours))} ${escapeHtml(tc("hours"))}</strong>`;

      const offRoster = member.adhoc
        ? ` <span style="color:${EMAIL.muted};font-size:12px">${escapeHtml(tc("notOnRoster"))}</span>`
        : "";

      return `<tr>
        <td style="padding:5px 12px 5px 0;font-size:14px;color:${EMAIL.ink}">${escapeHtml(
          member.name
        )}${offRoster}</td>
        <td style="padding:5px 0;font-size:14px;text-align:right;color:${EMAIL.ink};white-space:nowrap">${hours}</td>
      </tr>`;
    })
    .join("");

  if (!rows) {
    return (
      heading(tc("sectionCrew")) +
      `<p style="margin:0;font-size:14px;color:${EMAIL.muted}">${escapeHtml(tc("nothingRecorded"))}</p>`
    );
  }

  return (
    heading(tc("sectionCrew")) +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">${rows}</table>`
  );
}

function materialsBlock(report: JobReport, lang: Lang): string {
  const rows = (report.materials ?? [])
    .map((item) => {
      const qty = item.qty !== null && item.qty !== undefined ? ` ×${escapeHtml(String(item.qty))}` : "";
      const cost =
        item.cost !== null && item.cost !== undefined ? escapeHtml(moneyExact(item.cost)) : "";
      return `<tr>
        <td style="padding:5px 12px 5px 0;font-size:14px;color:${EMAIL.ink}">${escapeHtml(
          item.label?.[lang] ?? ""
        )}${qty} <span style="color:${EMAIL.muted};font-size:12px">${escapeHtml(item.source)}</span></td>
        <td style="padding:5px 0;font-size:14px;text-align:right;white-space:nowrap;color:${
          EMAIL.ink
        }">${cost}</td>
      </tr>`;
    })
    .join("");

  if (!rows) return "";

  const total = materialsTotalCost(report);
  return (
    heading(tc("materials")) +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">${rows}
      <tr><td style="padding:7px 12px 0 0;border-top:1px solid ${EMAIL.line};font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${
        EMAIL.muted
      }">${escapeHtml(tc("materialsSpend"))}</td>
      <td style="padding:7px 0 0;border-top:1px solid ${EMAIL.line};font-size:14px;font-weight:700;text-align:right;color:${
        EMAIL.ink
      }">${escapeHtml(moneyExact(total))}</td></tr>
    </table>`
  );
}

function attachmentsFooter(report: JobReport): string {
  const photoCount = report.photos?.length ?? 0;
  const photos =
    photoCount > 0 ? tcf("emailPhotosAttached", { n: photoCount }) : tc("emailNoPhotosAttached");

  const submittedAt = report.submittedAt
    ? tcf("emailSentAt", { at: new Date(report.submittedAt).toLocaleString("en-US") })
    : "";

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:28px;border-top:1px solid ${
    EMAIL.line
  }">
    <tr><td style="padding-top:14px;font-size:12px;color:${EMAIL.muted};line-height:1.6">
      ${escapeHtml(tc("emailPdfAttached"))}<br>${escapeHtml(photos)}
    </td></tr>
    <tr><td style="padding-top:10px;font-size:11px;color:${EMAIL.muted}">${escapeHtml(
      submittedAt
    )}</td></tr>
  </table>`;
}

/* ------------------------------------------------------------------ */
/* The whole thing                                                     */
/* ------------------------------------------------------------------ */

/**
 * `lang` is the language the *foreman* filled the form in, and it is used for
 * exactly one thing: reading catalog labels, which arrive stamped `{en, es}`.
 * Every word the email says on its own behalf comes from `tc()` at
 * `CONSOLE_LANG`, because the reader is the office, not the man who sent it.
 *
 * `report` is expected to have been through the API route's normalization, which
 * is what guarantees `crew` is an array — the flags come from `lib/calc.ts`, and
 * that is deliberately strict. Fields this module reads itself are defaulted
 * here anyway, because an outbox written by an older build can be missing whole
 * arrays and one stranded report should not be stranded forever.
 */
export function reportEmailHtml({
  report,
  lang,
  url,
}: {
  report: JobReport;
  lang: Lang;
  url: string | null;
}): string {
  const flags = reportFlags(report);

  return `<!doctype html>
<html lang="${CONSOLE_LANG}"><body style="margin:0;padding:0;background:${EMAIL.sunk}">
${preheader(report, flags.length > 0)}
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:${
    EMAIL.sunk
  }">
<tr><td align="center" style="padding:20px 12px">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:620px;background:${
    EMAIL.surface
  };border:1px solid ${EMAIL.line};border-radius:14px">
<tr><td style="padding:24px;font-family:${FONT};color:${EMAIL.ink}">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px"><tr>
    <td style="width:26px;height:26px;background:${EMAIL.accent};border-radius:6px;text-align:center;vertical-align:middle;font-size:8px;font-weight:800;letter-spacing:-.02em;color:${
      EMAIL.accentContrast
    }">BTN</td>
    <td style="padding-left:9px;font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:${
      EMAIL.ink
    }">${escapeHtml(tc("company"))}</td>
  </tr></table>

  <h1 style="margin:0 0 3px;font-size:23px;font-weight:800;letter-spacing:-.01em;color:${
    EMAIL.ink
  }">${escapeHtml(report.clientName)}</h1>
  <p style="margin:0 0 16px;color:${EMAIL.muted};font-size:14px">${escapeHtml(
    report.date
  )} · ${escapeHtml(dayOfWeek(report.date, CONSOLE_LANG))}${
    report.jobNumbers?.length
      ? ` · ${escapeHtml(tc("jobShort"))} ${escapeHtml(report.jobNumbers.join(", "))}`
      : ""
  }</p>

  ${flagsRow(report)}
  ${linkBlock(url)}
  ${statsRow(report)}
  ${factsTable(report)}
  ${descriptionBlock(report)}
  ${report.notes?.trim() ? `${heading(tc("notesLabel"))}<p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;color:${EMAIL.ink}">${escapeHtml(report.notes)}</p>` : ""}
  ${crewBlock(report)}
  ${materialsBlock(report, lang)}
  ${attachmentsFooter(report)}

</td></tr>
</table>
</td></tr>
</table>
</body></html>`.trim();
}
