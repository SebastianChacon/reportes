"use client";

import React from "react";
import { tc } from "@/lib/i18n";

export type StoredDescription = {
  original: string;
  originalLang: string;
  translation: string | null;
  translationLang: string | null;
  unknownTerms: string[];
};

/**
 * What the crew did, in both languages.
 *
 * The console shows the translation and keeps the original one click away —
 * never replaced, never hidden. The foreman wrote the original; the translation
 * is a convenience laid on top of it, and when the two disagree the words the
 * man actually typed are the record.
 *
 * With no translation stored there is nothing to toggle, and the original is
 * simply the text.
 */
export function Description({ description }: { description: StoredDescription }) {
  const hasTranslation =
    description.translation !== null && description.translation.trim().length > 0;
  const [showOriginal, setShowOriginal] = React.useState(false);

  const showing = hasTranslation && !showOriginal ? description.translation! : description.original;
  const showingLang =
    hasTranslation && !showOriginal
      ? description.translationLang ?? ""
      : description.originalLang ?? "";

  if (description.original.trim().length === 0 && !hasTranslation) {
    return <p className="text-sm text-[color:var(--ink-muted)]">{tc("nothingRecorded")}</p>;
  }

  return (
    <div>
      {hasTranslation && (
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
            {showOriginal ? tc("original") : tc("translation")}
          </span>
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="rounded-md text-sm font-semibold underline underline-offset-2 transition hover:text-[color:var(--ink-muted)]"
          >
            {showOriginal ? tc("showTranslation") : tc("showOriginal")}
          </button>
        </div>
      )}

      <p lang={showingLang || undefined} className="whitespace-pre-wrap text-[15px] leading-relaxed">
        {showing}
      </p>

      {/* Words the glossary did not know, left exactly as written. Worth showing
          the office: they are usually a plant name or a local term, and they are
          the places a translation is least trustworthy. */}
      {description.unknownTerms.length > 0 && (
        <p className="mt-3 text-xs text-[color:var(--ink-muted)]">
          {description.unknownTerms.join(" · ")}
        </p>
      )}
    </div>
  );
}
