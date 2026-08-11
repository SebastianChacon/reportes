/**
 * The console's small glyphs.
 *
 * They matter more here than they would on a coloured screen. With no hue left
 * to carry state, an icon is one of the three channels doing that work — the
 * other two being weight and the rule down a card's left edge — so these are
 * part of the meaning rather than decoration beside it.
 *
 * All of them draw in `currentColor` and take their size from the caller, so a
 * glyph inherits the ink of whatever it sits in and survives forced-colours mode
 * without a special case.
 */

type IconProps = { size?: number; className?: string };

/** Settled. Nothing here needs a person. */
export function Check({ size = 13, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4 12.5l5.2 5.2L20 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Something about this report did not add up on the phone. */
export function Warning({ size = 11, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 8v5m0 3.5v.5M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Forward, into a report or a deeper screen. */
export function Chevron({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
