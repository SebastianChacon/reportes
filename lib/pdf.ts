import { jsPDF } from "jspdf";
import { ROLE_CODES } from "./catalog";
import { crewTotalHours, formatHours, formatMoney, materialsTotalCost, onSiteHours, totalDayHours, travelHours } from "./calc";
import { dayOfWeek, t } from "./i18n";
import type { JobReport, Lang, L10n } from "./types";

const PAGE = { w: 612, h: 792 };
const M = { top: 42, bottom: 46, left: 40, right: 40 };
const CONTENT_W = PAGE.w - M.left - M.right;

const INK = { r: 24, g: 24, b: 27 };
const MUTED = { r: 113, g: 113, b: 122 };
const RULE = { r: 212, g: 212, b: 216 };
const BRAND = { r: 22, g: 101, b: 52 };

type Ctx = { doc: jsPDF; y: number; lang: Lang; page: number };

function label(l: L10n, lang: Lang): string {
  return l[lang];
}

function newPage(ctx: Ctx): void {
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = M.top;
  footer(ctx);
}

function ensure(ctx: Ctx, needed: number): void {
  if (ctx.y + needed > PAGE.h - M.bottom) newPage(ctx);
}

function footer(ctx: Ctx): void {
  const { doc } = ctx;
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFont("helvetica", "normal");
  doc.text("Back to Nature — Job Report (form YW 6/5/26)", M.left, PAGE.h - 26);
  doc.text(String(ctx.page), PAGE.w - M.right, PAGE.h - 26, { align: "right" });
}

function sectionTitle(ctx: Ctx, text: string): void {
  ensure(ctx, 30);
  const { doc } = ctx;
  ctx.y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text(text.toUpperCase(), M.left, ctx.y);
  ctx.y += 4;
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(0.8);
  doc.line(M.left, ctx.y, M.left + CONTENT_W, ctx.y);
  ctx.y += 9;
}

/** Two-column key/value line. */
function field(ctx: Ctx, key: string, value: string, x = M.left, w = CONTENT_W): void {
  ensure(ctx, 16);
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(key.toUpperCase(), x, ctx.y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(value || "—", x, ctx.y + 11, { maxWidth: w });
  ctx.y += 23;
}

/** Row of fields laid out side by side. */
function fieldRow(ctx: Ctx, items: { key: string; value: string }[]): void {
  ensure(ctx, 28);
  const colW = CONTENT_W / items.length;
  const startY = ctx.y;
  let maxY = ctx.y;
  items.forEach((item, i) => {
    ctx.y = startY;
    field(ctx, item.key, item.value, M.left + i * colW, colW - 8);
    maxY = Math.max(maxY, ctx.y);
  });
  ctx.y = maxY;
}

function table(ctx: Ctx, headers: string[], widths: number[], rows: string[][]): void {
  if (rows.length === 0) return;
  const { doc } = ctx;
  ensure(ctx, 30);

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    let x = M.left;
    headers.forEach((h, i) => {
      const alignRight = i > 0 && i >= headers.length - 2;
      doc.text(h.toUpperCase(), alignRight ? x + widths[i] - 4 : x, ctx.y, {
        align: alignRight ? "right" : "left",
      });
      x += widths[i];
    });
    ctx.y += 4;
    doc.setDrawColor(RULE.r, RULE.g, RULE.b);
    doc.setLineWidth(0.5);
    doc.line(M.left, ctx.y, M.left + CONTENT_W, ctx.y);
    ctx.y += 10;
  };

  drawHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(INK.r, INK.g, INK.b);

  for (const row of rows) {
    if (ctx.y + 14 > PAGE.h - M.bottom) {
      newPage(ctx);
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(INK.r, INK.g, INK.b);
    }
    let x = M.left;
    row.forEach((cell, i) => {
      const alignRight = i > 0 && i >= row.length - 2;
      doc.text(cell || "—", alignRight ? x + widths[i] - 4 : x, ctx.y, {
        align: alignRight ? "right" : "left",
        maxWidth: widths[i] - 6,
      });
      x += widths[i];
    });
    ctx.y += 13.5;
  }
  ctx.y += 2;
}

function paragraph(ctx: Ctx, text: string, opts: { italic?: boolean; muted?: boolean } = {}): void {
  const { doc } = ctx;
  doc.setFont("helvetica", opts.italic ? "italic" : "normal");
  doc.setFontSize(opts.muted ? 8.5 : 10);
  if (opts.muted) doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  else doc.setTextColor(INK.r, INK.g, INK.b);

  const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
  for (const line of lines) {
    ensure(ctx, 14);
    doc.text(line, M.left, ctx.y);
    ctx.y += opts.muted ? 11.5 : 13;
  }
  ctx.y += 3;
}

/* ------------------------------------------------------------------ */

export function buildPdf(r: JobReport, lang: Lang): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const ctx: Ctx = { doc, y: M.top, lang, page: 1 };
  footer(ctx);

  /* ---- Masthead ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text("BACK TO NATURE", M.left, ctx.y + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(t("subtitle", lang), M.left, ctx.y + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(t("appTitle", lang).toUpperCase(), PAGE.w - M.right, ctx.y + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(
    r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "",
    PAGE.w - M.right,
    ctx.y + 20,
    { align: "right" }
  );

  ctx.y += 28;
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(1.4);
  doc.line(M.left, ctx.y, M.left + CONTENT_W, ctx.y);
  ctx.y += 16;

  /* ---- Job ---- */
  fieldRow(ctx, [
    { key: t("date", lang), value: r.date },
    { key: t("dayOfWeek", lang), value: dayOfWeek(r.date, lang) },
    { key: t("clientName", lang), value: r.clientName },
  ]);
  fieldRow(ctx, [
    { key: t("jobNumbers", lang), value: r.jobNumbers.join(", ") },
    { key: t("truckNumbers", lang), value: r.truckNumbers.join(", ") },
  ]);

  /* ---- Times ---- */
  sectionTitle(ctx, `${t("stepTimes", lang)}`);
  fieldRow(ctx, [
    { key: t("startYard", lang), value: r.startYard },
    { key: t("startJob", lang), value: r.startJob },
    { key: t("endJob", lang), value: r.endJob },
    { key: t("endYard", lang), value: r.endYard },
  ]);
  fieldRow(ctx, [
    { key: t("totalHours", lang), value: formatHours(totalDayHours(r)) },
    { key: t("onSiteHours", lang), value: formatHours(onSiteHours(r)) },
    { key: t("travelHours", lang), value: formatHours(travelHours(r)) },
  ]);

  /* ---- Crew ---- */
  if (r.crew.length) {
    sectionTitle(ctx, t("stepCrew", lang));
    table(
      ctx,
      [t("personName", lang), "", t("hrs", lang)],
      [CONTENT_W - 170, 110, 60],
      r.crew.map((c) => [
        c.name + (c.adhoc ? " *" : ""),
        c.roles.map((code) => label(ROLE_CODES[code] ?? { en: code, es: code }, lang)).join(", "),
        formatHours(c.hours),
      ])
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(
      `${t("crewTotal", lang)}: ${formatHours(crewTotalHours(r))} ${t("hrs", lang)}`,
      M.left + CONTENT_W,
      ctx.y,
      { align: "right" }
    );
    ctx.y += 14;
  }

  /* ---- Description, both languages ---- */
  sectionTitle(ctx, t("stepWork", lang));
  paragraph(ctx, r.description.original || "—");
  if (r.description.translation) {
    ctx.y += 2;
    paragraph(
      ctx,
      `[${r.description.translationLang === "en" ? "EN" : "ES"}] ${r.description.translation}`,
      { italic: true, muted: true }
    );
  }

  /* ---- Equipment ---- */
  if (r.equipment.length) {
    sectionTitle(ctx, t("equipment", lang));
    table(
      ctx,
      [t("equipment", lang), "", t("qty", lang), t("hrs", lang)],
      [CONTENT_W - 180, 80, 50, 50],
      r.equipment.map((e) => [
        label(e.label, lang),
        e.owner === "BTN" ? "BTN" : t("rental", lang),
        e.qty === null ? "" : String(e.qty),
        formatHours(e.hours),
      ])
    );
  }

  /* ---- Materials ---- */
  if (r.materials.length) {
    sectionTitle(ctx, t("materials", lang));
    table(
      ctx,
      [t("materials", lang), "", t("qty", lang), t("cost", lang)],
      [CONTENT_W - 180, 80, 50, 50],
      r.materials.map((m) => [
        label(m.label, lang) + (m.adhoc ? " *" : ""),
        m.source === "BTN" ? "BTN" : t("other", lang),
        m.qty === null ? "" : String(m.qty),
        m.cost === null ? "" : formatMoney(m.cost),
      ])
    );
  }

  /* ---- Plants ---- */
  if (r.plants.length) {
    sectionTitle(ctx, t("plants", lang));
    table(
      ctx,
      [t("plantName", lang), t("size", lang), t("vendor", lang), t("qty", lang), t("cost", lang)],
      [CONTENT_W - 260, 70, 110, 40, 40],
      r.plants.map((p) => [
        p.name,
        p.size,
        p.vendor,
        p.qty === null ? "" : String(p.qty),
        p.cost === null ? "" : formatMoney(p.cost),
      ])
    );
  }

  /* ---- Subcontractors ---- */
  if (r.subcontractors.length) {
    sectionTitle(ctx, t("subcontractors", lang));
    table(
      ctx,
      [t("trade", lang), t("vendor", lang), t("subDescription", lang)],
      [110, 130, CONTENT_W - 240],
      r.subcontractors.map((s) => [label(s.tradeLabel, lang), s.vendor, s.description])
    );
  }

  /* ---- Trucks & logistics ---- */
  const hasLogistics =
    r.trucks.length > 0 || r.mileageTrips !== null || r.mileageWhere || r.disposals;
  if (hasLogistics) {
    sectionTitle(ctx, `${t("trucks", lang)} / ${t("logistics", lang)}`);
    if (r.trucks.length) {
      table(
        ctx,
        [t("trucks", lang), t("hrs", lang)],
        [CONTENT_W - 60, 60],
        r.trucks.map((tr) => [label(tr.label, lang), formatHours(tr.hours)])
      );
    }
    if (r.mileageTrips !== null || r.mileageWhere) {
      fieldRow(ctx, [
        { key: t("mileageTrips", lang), value: r.mileageTrips === null ? "" : String(r.mileageTrips) },
        { key: t("mileageWhere", lang), value: r.mileageWhere },
      ]);
    }
    if (r.disposals) field(ctx, t("disposals", lang), r.disposals);
  }

  const total = materialsTotalCost(r);
  if (total > 0) {
    ensure(ctx, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(`${t("materialsTotal", lang)}: ${formatMoney(total)}`, M.left + CONTENT_W, ctx.y, {
      align: "right",
    });
    ctx.y += 16;
  }

  /* ---- Notes ---- */
  if (r.notes) {
    sectionTitle(ctx, t("notes", lang));
    paragraph(ctx, r.notes);
  }

  // The "*" footnote belongs with the tables that use it, not after the
  // signatures — and putting it here stops it orphaning onto its own page.
  if (r.crew.some((c) => c.adhoc) || r.materials.some((m) => m.adhoc) || r.equipment.some((e) => e.adhoc)) {
    paragraph(
      ctx,
      lang === "es"
        ? "* Agregado manualmente, no está en la lista impresa."
        : "* Added manually, not on the printed list.",
      { muted: true, italic: true }
    );
  }

  /* ---- Signatures ---- */
  // Reserve exactly what the block needs so it never splits across pages —
  // and never triggers a page break it doesn't actually require.
  // 22pt for the section title + 62pt down to the caption baseline.
  ensure(ctx, 84);
  sectionTitle(ctx, `${t("foremanSignature", lang)} / ${t("pmSignature", lang)}`);
  const sigW = (CONTENT_W - 30) / 2;
  const sigY = ctx.y;
  const sigs: [string | null, string][] = [
    [r.foremanSignature, t("foremanSignature", lang)],
    [r.projectManagerSignature, t("pmSignature", lang)],
  ];
  sigs.forEach(([data, caption], i) => {
    const x = M.left + i * (sigW + 30);
    if (data) {
      try {
        doc.addImage(data, "PNG", x, sigY, sigW, 44);
      } catch {
        /* a malformed data URL should never lose the whole PDF */
      }
    }
    doc.setDrawColor(INK.r, INK.g, INK.b);
    doc.setLineWidth(0.6);
    doc.line(x, sigY + 48, x + sigW, sigY + 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(caption.toUpperCase(), x, sigY + 59);
  });
  ctx.y = sigY + 70;

  return doc;
}

export function pdfFileName(r: JobReport): string {
  const client = (r.clientName || "report").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const job = r.jobNumbers[0] ? `-${r.jobNumbers[0]}` : "";
  return `JobReport-${r.date}-${client}${job}.pdf`.toLowerCase();
}

export function pdfBase64(r: JobReport, lang: Lang): string {
  const out = buildPdf(r, lang).output("datauristring");
  return out.slice(out.indexOf(",") + 1);
}

export function downloadPdf(r: JobReport, lang: Lang): void {
  buildPdf(r, lang).save(pdfFileName(r));
}
