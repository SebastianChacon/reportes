import type { Viewport } from "next";

/**
 * The field wizard's shell.
 *
 * It holds one line, and that line used to live in the root layout — back when
 * the wizard *was* the root. It cannot stay there now that `/` is the chooser:
 * a fixed light `theme-color` on a page that follows the system into dark
 * leaves pale browser chrome above a dark screen, which on a phone reads as the
 * page having failed to load its own background. `/inicio` and `/office` each
 * already learned this and fixed it in their own layout; this is the third.
 *
 * Light in every condition, and not per-scheme like the desk surfaces, because
 * that is a deliberate property of this screen rather than an oversight: a
 * foreman reads it outdoors, where a dark theme is the wrong answer whatever
 * the OS says.
 */
export const viewport: Viewport = {
  themeColor: "#f4f4f4",
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
