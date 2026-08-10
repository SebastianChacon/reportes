/**
 * The overview's icons.
 *
 * One family, one stroke width, one 24-box, all `currentColor` — so a state
 * badge changes colour by changing its text colour and nothing has to be
 * restated. Every one is `aria-hidden`: each sits beside a word that already
 * says the same thing, which is also why colour is never the only signal.
 */

type IconProps = { className?: string };

const BASE = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Switched on. */
export function IconCheck({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Switched off — a dash, not a cross: nothing here is broken. */
export function IconDash({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

/** Needs no configuration at all. */
export function IconDot({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
