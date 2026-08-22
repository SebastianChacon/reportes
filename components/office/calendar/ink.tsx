"use client";

import { MARKER_COLORS, type MarkerColor } from "@/lib/calendarBoard";
import { tc } from "@/lib/i18n";
import type { ConsoleKey } from "@/lib/i18n";

/**
 * The marker tray.
 *
 * One place that knows a colour's CSS variable and its name, because those two
 * must never disagree: the swatch a person picks from is the only legend this
 * board has, and a swatch labelled "green" that paints blue would make the whole
 * notation untrustworthy.
 */

export const inkVar = (color: MarkerColor) => `var(--marker-${color})`;

const NAMES: Record<MarkerColor, ConsoleKey> = {
  red: "boardInkRed",
  green: "boardInkGreen",
  blue: "boardInkBlue",
  orange: "boardInkOrange",
  ink: "boardInkInk",
};

export const inkName = (color: MarkerColor) => tc(NAMES[color]);

/**
 * Five buttons, one per pen.
 *
 * Radio semantics rather than five toggles: exactly one is chosen at a time, and
 * a screen reader should say "3 of 5" rather than reading five unrelated
 * checkboxes. The check mark is drawn as well as the ring, because the ring
 * alone is a colour distinction on a control whose entire subject is colour.
 */
export function InkSwatches({
  value,
  onPick,
  label,
}: {
  value: MarkerColor;
  onPick: (color: MarkerColor) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1.5">
      {MARKER_COLORS.map((color) => {
        const chosen = color === value;

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={chosen}
            title={inkName(color)}
            onClick={() => onPick(color)}
            className={`grid h-7 w-7 place-items-center rounded-full border transition ${
              chosen
                ? "border-[color:var(--ink)] ring-2 ring-[color:var(--ink)] ring-offset-1 ring-offset-[color:var(--board)]"
                : "border-[color:var(--line)] hover:border-[color:var(--ink-muted)]"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full"
              style={{ background: inkVar(color) }}
            />
            <span className="sr-only">{inkName(color)}</span>
          </button>
        );
      })}
    </div>
  );
}
