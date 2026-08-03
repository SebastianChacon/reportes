"use client";

import React from "react";
import { t, type UIKey } from "@/lib/i18n";
import { downloadPdf, pdfBase64, pdfFileName } from "@/lib/pdf";
import {
  clearDraft,
  detectBrowserLang,
  loadDraft,
  loadLang,
  loadOutbox,
  queueReport,
  removeFromOutbox,
  saveDraft,
  saveLang,
  saveLastCrew,
  saveLastJobInfo,
  type OutboxItem,
} from "@/lib/storage";
import { emptyReport, type JobReport, type Lang } from "@/lib/types";
import { missingRequired } from "@/lib/calc";
import { stripDataUrlPrefix } from "@/lib/photos";
import { LanguageToggle } from "./LanguageToggle";
import { OutboxPanel } from "./OutboxPanel";
import { StepCrew } from "./steps/StepCrew";
import { StepJob } from "./steps/StepJob";
import { StepResources } from "./steps/StepResources";
import { StepReview } from "./steps/StepReview";
import { StepTimes } from "./steps/StepTimes";
import { StepWork } from "./steps/StepWork";
import { Button, IconArrowLeft } from "./ui";

const STEPS: UIKey[] = ["stepJob", "stepTimes", "stepCrew", "stepWork", "stepResources", "stepReview"];

type SendStatus = "idle" | "sending" | "error";

/** POST one report to the office. Shared by the main "Send" button and outbox retries. */
async function sendReport(report: JobReport, lang: Lang): Promise<boolean> {
  try {
    const response = await fetch("/api/send-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report,
        lang,
        pdfBase64: pdfBase64(report, lang),
        fileName: pdfFileName(report),
        photos: (report.photos ?? []).map(stripDataUrlPrefix),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Remember this crew/job for "same as last time" — regardless of whether the send happened live or on retry. */
function rememberForNextTime(report: JobReport): void {
  saveLastCrew(report.crew);
  saveLastJobInfo({
    clientName: report.clientName,
    jobNumbers: report.jobNumbers,
    truckNumbers: report.truckNumbers,
  });
}

export function JobReportApp() {
  const [lang, setLang] = React.useState<Lang>("es");
  const [report, setReport] = React.useState<JobReport>(() => emptyReport("es"));
  const [step, setStep] = React.useState(0);
  const [status, setStatus] = React.useState<SendStatus>("idle");
  const [done, setDone] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [outbox, setOutbox] = React.useState<OutboxItem[]>([]);
  const [outboxOpen, setOutboxOpen] = React.useState(false);
  const [resendingId, setResendingId] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(true);
  const mainRef = React.useRef<HTMLElement>(null);
  const langRef = React.useRef(lang);
  langRef.current = lang;

  /* ---- restore language + draft on first paint ---- */
  React.useEffect(() => {
    const storedLang = loadLang() ?? detectBrowserLang();
    setLang(storedLang);
    document.documentElement.lang = storedLang;

    // Merge onto a fresh report so fields added after a draft was saved
    // (like `photos`) don't come back `undefined` and crash the UI.
    const draft = loadDraft();
    setReport(draft ? { ...emptyReport(storedLang), ...draft } : emptyReport(storedLang));
    setHydrated(true);
  }, []);

  /* ---- autosave: the phone dies, the report doesn't ---- */
  React.useEffect(() => {
    if (!hydrated || done) return;
    saveDraft(report);
  }, [report, hydrated, done]);

  /* ---- connectivity: visible from step 1, not just at review ---- */
  React.useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  /* ---- outbox: reports that failed to send earlier, retried when signal comes back ---- */
  React.useEffect(() => {
    if (!hydrated) return;
    setOutbox(loadOutbox());

    const flush = async () => {
      for (const item of loadOutbox()) {
        const ok = await sendReport(item.report, langRef.current);
        if (ok) {
          removeFromOutbox(item.id);
          rememberForNextTime(item.report);
        }
      }
      setOutbox(loadOutbox());
    };

    if (navigator.onLine) flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [hydrated]);

  const retryOutboxItem = async (item: OutboxItem) => {
    setResendingId(item.id);
    const ok = await sendReport(item.report, lang);
    if (ok) {
      removeFromOutbox(item.id);
      rememberForNextTime(item.report);
      setOutbox(loadOutbox());
    }
    setResendingId(null);
  };

  const changeLang = (next: Lang) => {
    setLang(next);
    saveLang(next);
    document.documentElement.lang = next;
  };

  const update = React.useCallback((patch: Partial<JobReport>) => {
    setReport((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = (index: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, index)));
    // Land at the top of the new step, not halfway down the previous one.
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handleDownload = () => {
    downloadPdf({ ...report, submittedAt: report.submittedAt ?? new Date().toISOString() }, lang);
  };

  const handleSend = async () => {
    if (missingRequired(report).length > 0) return;
    setStatus("sending");

    const submitted: JobReport = { ...report, submittedAt: new Date().toISOString() };
    const ok = await sendReport(submitted, lang);

    if (ok) {
      rememberForNextTime(submitted);
      clearDraft();
      setReport(submitted);
      setDone(true);
      setStatus("idle");
    } else {
      // Hold it on the device so a dead spot never costs a day's paperwork.
      queueReport(submitted);
      setOutbox(loadOutbox());
      setStatus("error");
    }
  };

  const startNew = () => {
    clearDraft();
    setReport(emptyReport(lang));
    setStep(0);
    setDone(false);
    setStatus("idle");
    window.scrollTo({ top: 0 });
  };

  const reset = () => {
    setConfirmReset(false);
    startNew();
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 px-5 text-center">
        <span
          aria-hidden="true"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--accent-soft)]"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[color:var(--accent)]">
            <path
              d="m5 12.5 4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-bold">{t("sent", lang)}</h1>
          <p className="mt-1.5 text-[color:var(--ink-muted)]">{t("sentBody", lang)}</p>
        </div>
        <div className="w-full space-y-2.5">
          <Button variant="primary" full onClick={startNew}>
            {t("newReport", lang)}
          </Button>
          <Button full onClick={handleDownload}>
            {t("downloadPdf", lang)}
          </Button>
        </div>
      </main>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[color:var(--surface)]/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 pb-2.5 pt-3">
          {step > 0 && (
            <button
              type="button"
              aria-label={t("back", lang)}
              onClick={() => goTo(step - 1)}
              className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[color:var(--ink)] transition active:bg-[color:var(--accent-soft)]"
            >
              <IconArrowLeft />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold uppercase tracking-widest text-[color:var(--accent)]">
              {t("company", lang)}
            </p>
            <h1 className="truncate text-lg font-bold leading-tight">{t("appTitle", lang)}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {outbox.length > 0 && (
              <button
                type="button"
                onClick={() => setOutboxOpen(true)}
                className="chip font-semibold"
              >
                {outbox.length} {t("pendingCount", lang)}
              </button>
            )}
            <LanguageToggle lang={lang} onChange={changeLang} />
          </div>
        </div>

        {!online && (
          <div className="px-4 pb-2.5">
            <p className="rounded-lg bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-medium text-[color:var(--accent)]">
              {t("offline", lang)}
            </p>
          </div>
        )}

        {/* ---- Progress ---- */}
        <div className="px-4 pb-2.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold">
              {t(STEPS[step], lang)}
            </span>
            <span className="text-xs tabular-nums text-[color:var(--ink-muted)]">
              {t("step", lang)} {step + 1} {t("of", lang)} {STEPS.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label={t("step", lang)}
            className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-sunk)]"
          >
            <div
              className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* ---- Step body ---- */}
      <main ref={mainRef} className="step-enter flex-1 px-4 py-4" key={step}>
        {step === 0 && <StepJob report={report} lang={lang} update={update} />}
        {step === 1 && <StepTimes report={report} lang={lang} update={update} />}
        {step === 2 && <StepCrew report={report} lang={lang} update={update} />}
        {step === 3 && <StepWork report={report} lang={lang} update={update} />}
        {step === 4 && <StepResources report={report} lang={lang} update={update} />}
        {step === 5 && (
          <StepReview
            report={report}
            lang={lang}
            update={update}
            onEditStep={goTo}
            onSend={handleSend}
            onDownload={handleDownload}
            status={status}
          />
        )}

        <div className="mt-6 flex items-center justify-between gap-3 pb-2">
          <p className="text-xs text-[color:var(--ink-muted)]">✓ {t("autosaved", lang)}</p>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="text-xs font-medium text-[color:var(--ink-muted)] underline underline-offset-2"
          >
            {t("startOver", lang)}
          </button>
        </div>
      </main>

      {/* ---- Bottom nav ---- */}
      {!isLast && (
        <nav
          className="sticky bottom-0 z-20 border-t border-[color:var(--line)] bg-[color:var(--surface)]/95 px-4 py-3 backdrop-blur"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-3">
            {step > 0 && (
              <Button onClick={() => goTo(step - 1)} className="flex-1">
                {t("back", lang)}
              </Button>
            )}
            <Button variant="primary" onClick={() => goTo(step + 1)} className="flex-[2]">
              {t("next", lang)}
            </Button>
          </div>
        </nav>
      )}

      {/* ---- Reset confirmation ---- */}
      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("startOverConfirm", lang)}
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="card w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[15px] font-semibold">{t("startOverConfirm", lang)}</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => setConfirmReset(false)} className="flex-1">
                {t("cancel", lang)}
              </Button>
              <Button variant="danger" onClick={reset} className="flex-1">
                {t("confirm", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Pending reports ---- */}
      {outboxOpen && (
        <OutboxPanel
          lang={lang}
          items={outbox}
          resendingId={resendingId}
          onResend={retryOutboxItem}
          onClose={() => setOutboxOpen(false)}
        />
      )}
    </div>
  );
}
