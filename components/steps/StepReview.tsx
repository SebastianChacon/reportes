"use client";

import { ROLE_CODES } from "@/lib/catalog";
import {
  crewTotalHours,
  formatHours,
  formatMoney,
  materialsTotalCost,
  missingRequired,
  onSiteHours,
  totalDayHours,
  warnings,
} from "@/lib/calc";
import { dayOfWeek, t, UI, type UIKey } from "@/lib/i18n";
import type { JobReport, Lang } from "@/lib/types";
import { SignaturePad } from "../SignaturePad";
import { Button, Section } from "../ui";

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs uppercase tracking-wide text-[color:var(--ink-muted)]">
        {k}
      </span>
      <span className="min-w-0 text-right text-[15px] font-semibold">{v || "—"}</span>
    </div>
  );
}

export function StepReview({
  report,
  lang,
  update,
  onEditStep,
  onSend,
  onDownload,
  status,
}: {
  report: JobReport;
  lang: Lang;
  update: (patch: Partial<JobReport>) => void;
  onEditStep: (index: number) => void;
  onSend: () => void;
  onDownload: () => void;
  status: "idle" | "sending" | "error";
}) {
  const missing = missingRequired(report);
  const warns = warnings(report);
  const total = materialsTotalCost(report);

  const missingLabel = (key: string) => {
    const map: Record<string, UIKey> = {
      date: "date",
      clientName: "clientName",
      jobNumbers: "jobNumbers",
      description: "description",
    };
    const uiKey = map[key];
    return uiKey ? UI[uiKey][lang] : key;
  };

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <div className="rounded-xl border-[1.5px] border-[color:var(--color-clay-600)] bg-[color:var(--surface-raised)] p-4">
          <p className="text-sm font-bold text-[color:var(--color-clay-600)]">
            {t("missingFields", lang)}
          </p>
          <ul className="mt-2 space-y-1">
            {missing.map((m) => (
              <li key={m} className="text-sm">
                • {missingLabel(m)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warns.length > 0 && (
        <ul className="space-y-1.5">
          {warns.map((w) => (
            <li
              key={w.key}
              className="rounded-lg bg-[color:var(--surface-raised)] px-3 py-2 text-sm text-[color:var(--ink-muted)]"
            >
              ⚠ {UI[w.key as UIKey][lang]}
            </li>
          ))}
        </ul>
      )}

      <Section
        title={t("stepJob", lang)}
        action={
          <Button variant="ghost" onClick={() => onEditStep(0)} className="!min-h-9 !px-2 !text-xs">
            {t("edit", lang)}
          </Button>
        }
      >
        <Line k={t("date", lang)} v={`${report.date}  ${dayOfWeek(report.date, lang)}`} />
        <Line k={t("clientName", lang)} v={report.clientName} />
        <Line k={t("jobNumbers", lang)} v={report.jobNumbers.map((n) => `#${n}`).join(", ")} />
        {report.truckNumbers.length > 0 && (
          <Line k={t("truckNumbers", lang)} v={report.truckNumbers.map((n) => `#${n}`).join(", ")} />
        )}
      </Section>

      <Section
        title={t("stepTimes", lang)}
        action={
          <Button variant="ghost" onClick={() => onEditStep(1)} className="!min-h-9 !px-2 !text-xs">
            {t("edit", lang)}
          </Button>
        }
      >
        <Line k={t("startYard", lang)} v={report.startYard} />
        <Line k={t("startJob", lang)} v={report.startJob} />
        <Line k={t("endJob", lang)} v={report.endJob} />
        <Line k={t("endYard", lang)} v={report.endYard} />
        <div className="mt-2 border-t border-[color:var(--line)] pt-2">
          <Line k={t("totalHours", lang)} v={formatHours(totalDayHours(report))} />
          <Line k={t("onSiteHours", lang)} v={formatHours(onSiteHours(report))} />
        </div>
      </Section>

      {report.crew.length > 0 && (
        <Section
          title={t("stepCrew", lang)}
          action={
            <Button variant="ghost" onClick={() => onEditStep(2)} className="!min-h-9 !px-2 !text-xs">
              {t("edit", lang)}
            </Button>
          }
        >
          <ul className="divide-y divide-[color:var(--line)]">
            {report.crew.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{c.name}</span>
                  {c.roles.length > 0 && (
                    <span className="text-xs text-[color:var(--ink-muted)]">
                      {c.roles.map((r) => ROLE_CODES[r]?.[lang] ?? r).join(" · ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums font-semibold">
                  {formatHours(c.hours)} {t("hrs", lang)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-[color:var(--line)] pt-2 text-right text-sm font-bold">
            {formatHours(crewTotalHours(report))} {t("hrs", lang)}
          </p>
        </Section>
      )}

      <Section
        title={t("stepWork", lang)}
        action={
          <Button variant="ghost" onClick={() => onEditStep(3)} className="!min-h-9 !px-2 !text-xs">
            {t("edit", lang)}
          </Button>
        }
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {report.description.original || "—"}
        </p>
        {report.description.translation && (
          <p className="mt-3 border-t border-[color:var(--line)] pt-3 text-sm italic leading-relaxed text-[color:var(--ink-muted)]">
            <span className="mr-1.5 font-bold uppercase not-italic">
              {report.description.translationLang}
            </span>
            {report.description.translation}
          </p>
        )}
        {report.notes && (
          <p className="mt-3 border-t border-[color:var(--line)] pt-3 text-sm">{report.notes}</p>
        )}
      </Section>

      {(report.equipment.length > 0 ||
        report.materials.length > 0 ||
        report.plants.length > 0 ||
        report.subcontractors.length > 0 ||
        report.trucks.length > 0) && (
        <Section
          title={t("stepResources", lang)}
          action={
            <Button variant="ghost" onClick={() => onEditStep(4)} className="!min-h-9 !px-2 !text-xs">
              {t("edit", lang)}
            </Button>
          }
        >
          {report.equipment.map((e) => (
            <Line
              key={e.id}
              k={e.label[lang]}
              v={[
                e.owner === "BTN" ? "BTN" : t("rental", lang),
                e.qty !== null ? `×${e.qty}` : "",
                e.hours !== null ? `${e.hours} ${t("hrs", lang)}` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
          {report.materials.map((m) => (
            <Line
              key={m.id}
              k={m.label[lang]}
              v={[
                m.source === "BTN" ? "BTN" : t("other", lang),
                m.qty !== null ? `×${m.qty}` : "",
                m.cost !== null ? formatMoney(m.cost) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
          {report.plants.map((p) => (
            <Line
              key={p.id}
              k={p.name || t("plants", lang)}
              v={[p.qty !== null ? `×${p.qty}` : "", p.size, p.vendor].filter(Boolean).join(" · ")}
            />
          ))}
          {report.subcontractors.map((s) => (
            <Line key={s.id} k={s.tradeLabel[lang]} v={[s.vendor, s.description].filter(Boolean).join(" — ")} />
          ))}
          {report.trucks.map((tr) => (
            <Line key={tr.id} k={tr.label[lang]} v={`${formatHours(tr.hours)} ${t("hrs", lang)}`} />
          ))}
          {total > 0 && (
            <p className="mt-2 border-t border-[color:var(--line)] pt-2 text-right text-sm font-bold">
              {t("materialsTotal", lang)}: {formatMoney(total)}
            </p>
          )}
        </Section>
      )}

      <Section title={`${t("foremanSignature", lang)} / ${t("pmSignature", lang)}`}>
        <div className="space-y-4">
          <SignaturePad
            label={t("foremanSignature", lang)}
            hint={t("signHere", lang)}
            clearLabel={t("clear", lang)}
            value={report.foremanSignature}
            onChange={(foremanSignature) => update({ foremanSignature })}
          />
          <SignaturePad
            label={t("pmSignature", lang)}
            hint={t("signHere", lang)}
            clearLabel={t("clear", lang)}
            value={report.projectManagerSignature}
            onChange={(projectManagerSignature) => update({ projectManagerSignature })}
          />
        </div>
      </Section>

      {status === "error" && (
        <p className="rounded-xl border-[1.5px] border-[color:var(--color-clay-600)] p-3 text-sm text-[color:var(--color-clay-600)]">
          {t("sendFailed", lang)}
        </p>
      )}

      <div className="space-y-2.5">
        <Button
          variant="primary"
          full
          disabled={missing.length > 0 || status === "sending"}
          onClick={onSend}
        >
          {status === "sending" ? t("sending", lang) : t("send", lang)}
        </Button>
        <Button full onClick={onDownload} disabled={missing.length > 0}>
          {t("downloadPdf", lang)}
        </Button>
      </div>
    </div>
  );
}
