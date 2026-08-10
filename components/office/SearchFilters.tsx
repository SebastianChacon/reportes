"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CREW, CREW_GROUPS } from "@/lib/catalog";
import { CONSOLE_LANG, tc } from "@/lib/i18n";
import { filtersFromForm, toQuery, type SearchFilters as Filters } from "@/lib/officeSearch";
import type { CrewGroup } from "@/lib/types";

/**
 * The filters, as a form that writes itself into the address bar.
 *
 * Uncontrolled on purpose. Nothing here needs to react to a keystroke — the
 * results come from the server on submit — so the boxes hold their own values
 * and this reads them once, which is also why re-typing a client name does not
 * re-render a list of two hundred reports underneath.
 *
 * That leaves one thing to get right: the browser's back button changes the URL
 * without remounting a client component, so the page mounts this under a `key`
 * of the current query. Going back restores the boxes that produced the results
 * being shown, instead of leaving last search's text over an older list.
 */

/** Roster people, grouped the way the phone groups them. */
const GROUPED: { group: CrewGroup; people: { id: string; name: string }[] }[] = (
  Object.keys(CREW_GROUPS) as CrewGroup[]
).map((group) => ({
  group,
  people: CREW.filter((member) => member.group === group)
    .map((member) => ({ id: member.id, name: member.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
}));

export type Account = { userId: string; name: string; role: string };

export function SearchFilters({
  filters,
  accounts,
}: {
  filters: Filters;
  accounts: Account[];
}) {
  const router = useRouter();
  const clientRef = React.useRef<HTMLInputElement>(null);

  const ids = {
    from: React.useId(),
    to: React.useId(),
    status: React.useId(),
    client: React.useId(),
    job: React.useId(),
    filedBy: React.useId(),
    person: React.useId(),
  };

  /**
   * `/` jumps to the client box — the filter a search almost always starts
   * with. Ignored while a field already has focus, or the shortcut would eat
   * the slash out of a name somebody is typing.
   */
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;

      const active = document.activeElement;
      const typing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable);
      if (typing) return;

      event.preventDefault();

      // Focused after this keystroke finishes, not during it. Moving focus
      // inside the handler hands the rest of the key to the newly focused
      // input, and the shortcut types a "/" into the box it just opened.
      // A timer rather than an animation frame: frames stop in a background
      // tab, and a shortcut that works only while the tab is on screen is a
      // shortcut that mysteriously stops working.
      window.setTimeout(() => {
        clientRef.current?.focus();
        clientRef.current?.select();
      }, 0);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = filtersFromForm(new FormData(event.currentTarget));
    router.push(`/office/reportes?${toQuery(next)}`);
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
          <Field id={ids.from} label={tc("filterFrom")}>
            <input id={ids.from} name="from" type="date" className="field" defaultValue={filters.from} />
          </Field>
          <Field id={ids.to} label={tc("filterTo")}>
            <input id={ids.to} name="to" type="date" className="field" defaultValue={filters.to} />
          </Field>
        </div>

        <Field id={ids.client} label={tc("filterClient")} hint={tc("filterClientHint")}>
          <input
            id={ids.client}
            ref={clientRef}
            name="client"
            type="search"
            autoComplete="off"
            className="field"
            defaultValue={filters.clientName}
          />
        </Field>

        <Field id={ids.job} label={tc("filterJob")} hint={tc("filterJobHint")}>
          <input
            id={ids.job}
            name="job"
            type="search"
            inputMode="numeric"
            autoComplete="off"
            className="field"
            defaultValue={filters.jobNumber}
          />
        </Field>

        <Field id={ids.status} label={tc("filterStatus")}>
          <select id={ids.status} name="status" className="field" defaultValue={filters.status ?? ""}>
            <option value="">{tc("filterAnyStatus")}</option>
            <option value="submitted">{tc("statusSubmitted")}</option>
            <option value="needs_review">{tc("statusNeedsReview")}</option>
            <option value="approved">{tc("statusApproved")}</option>
          </select>
        </Field>

        <Field id={ids.filedBy} label={tc("filterFiledBy")}>
          <select
            id={ids.filedBy}
            name="filedBy"
            className="field"
            defaultValue={filters.submittedBy ?? ""}
          >
            <option value="">{tc("filterAny")}</option>
            {accounts.map((account) => (
              <option key={account.userId} value={account.userId}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>

        {/* The roster, not the accounts: this asks who was *on* the crew, and
            most of the people on a crew have never signed into anything. */}
        <Field id={ids.person} label={tc("filterPerson")}>
          <select
            id={ids.person}
            name="person"
            className="field"
            defaultValue={filters.personId ?? ""}
          >
            <option value="">{tc("filterAny")}</option>
            {GROUPED.map(({ group, people }) => (
              <optgroup key={group} label={CREW_GROUPS[group][CONSOLE_LANG]}>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-[color:var(--accent)] px-5 text-[15px] font-semibold text-[color:var(--accent-contrast)] transition active:scale-[0.99]"
        >
          {tc("runSearch")}
        </button>

        {/* A link rather than a reset button: clearing is a different search,
            and it should be somewhere the back button can undo. */}
        <a
          href="/office/reportes"
          className="min-h-11 rounded-xl border-[1.5px] border-[color:var(--line)] px-4 py-2.5 text-[15px] font-semibold transition hover:bg-[color:var(--accent-soft)]"
        >
          {tc("clearFilters")}
        </a>

        <p className="ml-auto hidden text-xs text-[color:var(--ink-muted)] sm:block">
          {tc("searchShortcut")}
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-[color:var(--ink-muted)]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
