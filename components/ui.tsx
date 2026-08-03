"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/* Labeled inputs                                                      */
/* ------------------------------------------------------------------ */

type BaseProps = {
  label: string;
  hint?: string;
  required?: boolean;
  id?: string;
};

export function TextField({
  label,
  hint,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-[color:var(--color-clay-600)]">*</span>}
      </label>
      <input
        id={id}
        className="field"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1.5 text-xs text-[color:var(--ink-muted)]">{hint}</p>}
    </div>
  );
}

export function TimeField({
  label,
  value,
  onChange,
}: BaseProps & { value: string; onChange: (v: string) => void }) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="field"
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  step = "0.25",
  compact,
  prefix,
}: BaseProps & {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  step?: string;
  compact?: boolean;
  prefix?: string;
}) {
  const id = React.useId();
  return (
    <div>
      {!compact && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--ink-muted)]">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className="field"
          style={prefix ? { paddingLeft: "1.75rem" } : undefined}
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          aria-label={compact ? label : undefined}
          placeholder={placeholder ?? label}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
        />
      </div>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  readOnly,
  hideLabel,
}: BaseProps & {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  /** Use when a surrounding Section heading already says the same thing. */
  hideLabel?: boolean;
}) {
  const id = React.useId();
  return (
    <div>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium"}
      >
        {label}
      </label>
      <textarea
        id={id}
        className="field resize-y leading-relaxed"
        rows={rows}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  full?: boolean;
};

export function Button({ variant = "secondary", full, className = "", ...rest }: ButtonProps) {
  const base =
    "touch-target inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const styles: Record<string, string> = {
    primary: "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-sm hover:brightness-110",
    secondary: "border-[1.5px] border-[color:var(--line)] bg-[color:var(--surface-raised)]",
    ghost: "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]",
    danger: "border-[1.5px] border-[color:var(--color-clay-600)] text-[color:var(--color-clay-600)]",
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

export function Section({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-[color:var(--ink-muted)]">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-[color:var(--line)] px-3 py-4 text-center text-sm text-[color:var(--ink-muted)]">
      {children}
    </p>
  );
}

/** Two-state pill, used for BTN / Rental and BTN / Other. */
export function Toggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-lg border-[1.5px] border-[color:var(--line)]"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-11 px-3 text-sm font-semibold transition ${
              active
                ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "bg-transparent text-[color:var(--ink-muted)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5m0 0 6-6m-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
