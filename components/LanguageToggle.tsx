"use client";

import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

/**
 * Globe icon + the two language codes. The inactive code stays visible so a
 * foreman who cannot read the current language can still find the way out.
 */
export function LanguageToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={t("language", lang)}
      className="flex items-center gap-1 rounded-full border-[1.5px] border-[color:var(--line)] bg-[color:var(--surface-raised)] p-1"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="ml-1.5 shrink-0 text-[color:var(--ink-muted)]"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      {(["es", "en"] as const).map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={code === "es" ? "Español" : "English"}
            onClick={() => onChange(code)}
            className={`min-h-9 min-w-11 rounded-full px-2.5 text-[13px] font-bold uppercase tracking-wide transition ${
              active
                ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "text-[color:var(--ink-muted)]"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
