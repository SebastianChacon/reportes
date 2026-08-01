"use client";

import React from "react";
import { IconPlus, IconSearch } from "./ui";

export type PickerOption = {
  id: string;
  /** Primary line shown in the list. */
  title: string;
  /** Optional dim second line (role codes, group name…). */
  subtitle?: string;
  /** Extra text matched by the search box but not displayed. */
  keywords?: string;
  group?: string;
};

/**
 * The paper form prints 200+ rows and the foreman ticks five of them.
 * On a phone that has to become search-and-add: nothing is rendered until
 * you type, and already-picked rows drop out of the results.
 */
export function SearchPicker({
  placeholder,
  options,
  selectedIds,
  onPick,
  onAddCustom,
  addCustomLabel,
  noResultsLabel,
  maxVisible = 8,
}: {
  placeholder: string;
  options: PickerOption[];
  selectedIds: string[];
  onPick: (option: PickerOption) => void;
  /** When provided, an unmatched query can be added as a free-text entry. */
  onAddCustom?: (text: string) => void;
  addCustomLabel?: string;
  noResultsLabel: string;
  maxVisible?: number;
}) {
  const [query, setQuery] = React.useState("");
  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const normalized = normalize(query);

  // Nothing is listed until the foreman types. A default dump of 8 rows would
  // push the "already added" list — the thing they actually need to see —
  // off the bottom of a phone screen.
  const matches = React.useMemo(() => {
    if (!normalized) return [];
    return options
      .filter((o) => !selected.has(o.id))
      .filter((o) => normalize(`${o.title} ${o.subtitle ?? ""} ${o.keywords ?? ""}`).includes(normalized))
      .slice(0, maxVisible);
  }, [options, selected, normalized, maxVisible]);

  const exactMatch = matches.some((m) => normalize(m.title) === normalized);
  const canAddCustom = Boolean(onAddCustom) && normalized.length > 1 && !exactMatch;

  const addCustom = () => {
    if (!canAddCustom) return;
    onAddCustom?.(query.trim());
    setQuery("");
  };

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-muted)]">
          <IconSearch />
        </span>
        <input
          className="field"
          style={{ paddingLeft: "2.5rem" }}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (matches.length > 0) {
              onPick(matches[0]);
              setQuery("");
            } else {
              addCustom();
            }
          }}
        />
      </div>

      {(matches.length > 0 || canAddCustom || normalized.length > 0) && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-[color:var(--line)]">
          {matches.map((opt, i) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(opt);
                  setQuery("");
                }}
                className={`flex w-full touch-target items-center justify-between gap-3 px-3.5 py-3 text-left transition active:bg-[color:var(--accent-soft)] ${
                  i > 0 ? "border-t border-[color:var(--line)]" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{opt.title}</span>
                  {opt.subtitle && (
                    <span className="block truncate text-xs text-[color:var(--ink-muted)]">
                      {opt.subtitle}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[color:var(--accent)]">
                  <IconPlus />
                </span>
              </button>
            </li>
          ))}

          {matches.length === 0 && !canAddCustom && (
            <li className="px-3.5 py-4 text-center text-sm text-[color:var(--ink-muted)]">
              {noResultsLabel}
            </li>
          )}

          {canAddCustom && (
            <li>
              <button
                type="button"
                onClick={addCustom}
                className={`flex w-full touch-target items-center gap-2 px-3.5 py-3 text-left text-[15px] font-semibold text-[color:var(--accent)] ${
                  matches.length > 0 ? "border-t border-[color:var(--line)]" : ""
                }`}
              >
                <IconPlus />
                <span className="truncate">
                  {addCustomLabel} “{query.trim()}”
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
