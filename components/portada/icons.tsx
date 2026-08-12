/**
 * The chooser's icons.
 *
 * Same family as `components/home/icons.tsx` — one stroke width, one 24-box,
 * `currentColor`, `aria-hidden` — because the two screens link to each other
 * and a second drawing style across that link reads as a different product.
 *
 * Only the padlock lives here rather than there. It is the one mark this screen
 * needs that the overview never did, and it carries the whole asymmetry between
 * the two doors: one is open, one wants a password, and this says so before the
 * click rather than after it. It is never the *only* signal — the word beside
 * it says the same thing, which is what keeps the meaning for anyone who does
 * not see the icon at all.
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

/** The door that wants a password. */
export function IconLock({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
