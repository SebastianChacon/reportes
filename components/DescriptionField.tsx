"use client";

import React from "react";
import { t } from "@/lib/i18n";
import { glossaryCoverage, translator } from "@/lib/translate";
import type { Description, Lang } from "@/lib/types";
import { Button } from "./ui";

/**
 * Description box with an EN/ES view switch.
 *
 * The rules the foreman asked for:
 *  - what you typed is `original` and is never overwritten;
 *  - pressing a language button once translates and caches it;
 *  - pressing the SAME button again returns to the original — no second
 *    translation, no extra work;
 *  - editing the original invalidates the cache so the next press is fresh.
 */
export function DescriptionField({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: Description;
  onChange: (next: Description) => void;
}) {
  const [busy, setBusy] = React.useState<Lang | null>(null);

  const originalLang = value.original.trim() ? translator.detect(value.original) : value.originalLang;
  const showing = value.showingTranslation && value.translation !== null;

  const handleEdit = (text: string) => {
    if (showing) return; // the translated view is read-only
    onChange({
      ...value,
      original: text,
      originalLang: text.trim() ? translator.detect(text) : lang,
      // The cached translation belongs to the previous text — drop it.
      translation: null,
      translationLang: null,
      unknownTerms: [],
      showingTranslation: false,
    });
  };

  const handleLangButton = async (target: Lang) => {
    if (!value.original.trim()) return;

    // Already looking at this language → go back to the original.
    if (showing && value.translationLang === target) {
      onChange({ ...value, showingTranslation: false });
      return;
    }

    // The original is already in that language → just show the original.
    if (target === originalLang) {
      onChange({ ...value, showingTranslation: false });
      return;
    }

    // Cached from before → reuse it, don't translate again.
    if (value.translation !== null && value.translationLang === target) {
      onChange({ ...value, showingTranslation: true });
      return;
    }

    setBusy(target);
    try {
      const result = await translator.translate(value.original, target);
      onChange({
        ...value,
        translation: result.text,
        translationLang: target,
        unknownTerms: result.unknownTerms,
        showingTranslation: true,
      });
    } finally {
      setBusy(null);
    }
  };

  const displayed = showing ? value.translation ?? "" : value.original;
  const coverage = showing
    ? glossaryCoverage({ text: value.translation ?? "", unknownTerms: value.unknownTerms })
    : 1;

  const buttonLabel = (target: Lang) => {
    if (busy === target) return t("translating", lang);
    if (showing && value.translationLang === target) return t("showOriginal", lang);
    return target === "en" ? t("showInEnglish", lang) : t("showInSpanish", lang);
  };

  return (
    <div>
      <label htmlFor="job-description" className="mb-1.5 block text-sm font-medium">
        {t("description", lang)}
        <span className="ml-1 text-[color:var(--danger)]">*</span>
      </label>

      <div className="relative">
        <textarea
          id="job-description"
          className="field resize-y leading-relaxed"
          rows={7}
          value={displayed}
          readOnly={showing}
          placeholder={t("descriptionPlaceholder", lang)}
          onChange={(e) => handleEdit(e.target.value)}
        />
        {showing && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-[color:var(--accent-soft)] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--accent)]">
            {value.translationLang}
          </span>
        )}
      </div>

      {showing && (
        <p className="mt-1.5 text-xs text-[color:var(--ink-muted)]">{t("translatedLabel", lang)}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {(["en", "es"] as const).map((target) => {
          const isActive = showing && value.translationLang === target;
          return (
            <Button
              key={target}
              type="button"
              variant={isActive ? "primary" : "secondary"}
              disabled={!value.original.trim() || busy !== null}
              onClick={() => handleLangButton(target)}
              className="!py-2.5 !text-sm"
            >
              <span
                aria-hidden="true"
                className="text-[11px] font-black uppercase tracking-wider opacity-70"
              >
                {target}
              </span>
              {buttonLabel(target)}
            </Button>
          );
        })}
      </div>

      {value.original.trim() && (
        <p className="mt-2 text-xs text-[color:var(--ink-muted)]">{t("bothSent", lang)}</p>
      )}

      {showing && value.unknownTerms.length > 0 && (
        <div className="mt-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-sunk)] p-3">
          <p className="text-xs font-semibold text-[color:var(--ink-muted)]">
            {t("unknownTermsLabel", lang)}
          </p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {value.unknownTerms.slice(0, 12).map((term) => (
              <span
                key={term}
                className="rounded-md bg-[color:var(--surface-raised)] px-1.5 py-0.5 font-mono text-xs"
              >
                {term}
              </span>
            ))}
          </p>
          {coverage < 0.75 && (
            <p className="mt-2 text-xs text-[color:var(--danger)]">
              {lang === "es"
                ? "El glosario reconoció menos de la mitad del texto — revisa la traducción antes de confiar en ella."
                : "The glossary matched less than half of this text — read the translation before trusting it."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
