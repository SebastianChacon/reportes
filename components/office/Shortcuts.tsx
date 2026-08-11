"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * `/` goes to the search, from anywhere in the console.
 *
 * This used to live inside `SearchFilters`, which meant it only worked on the
 * one screen that already had the box in front of you — the shortcut existed
 * exactly where it was least needed. A project manager who wants to find a
 * report is almost always looking at the day board when the thought arrives.
 *
 * On the search page itself this does nothing and `SearchFilters` keeps its own
 * handler, which focuses the box without a navigation.
 */

/** Read once by `SearchFilters` on mount, then cleared. */
export const FOCUS_SEARCH = "office:focus-search";

export function Shortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // The search page owns the key while it is showing.
    if (pathname === "/office/reportes") return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;

      // Never eat a slash out of something somebody is typing — a date, a client
      // name, the note on a report being sent back.
      const active = document.activeElement;
      const typing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable);
      if (typing) return;

      event.preventDefault();

      // Handed over rather than passed in the URL: a query parameter would make
      // "focus the box" part of the address, so sharing the link or reloading
      // would re-trigger it, and the search would steal focus for no reason.
      try {
        window.sessionStorage.setItem(FOCUS_SEARCH, "1");
      } catch {
        // Private mode, or storage disabled. The navigation still works; the
        // reader just has to click into the box themselves.
      }

      router.push("/office/reportes");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  return null;
}
