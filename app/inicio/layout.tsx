import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Panel — Back to Nature",
  description: "Todo lo que hace el reporte de trabajo, y qué tiene encendido este servidor",
};

/**
 * The root layout pins `theme-color` light, because the wizard it was written
 * for is light in every condition. This page is not, so it says so per scheme —
 * otherwise the browser chrome stays pale above a page that went dark, which on
 * a phone reads as the page having failed to load its own background.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f5" },
    { media: "(prefers-color-scheme: dark)", color: "#100f0b" },
  ],
};

/**
 * The overview's shell.
 *
 * `home` is a desk surface, so it opens dark mode the same way the console does
 * — see the token block in globals.css. No `lang` is declared here: unlike the
 * console, this page is bilingual at runtime, so the attribute is owned by the
 * client shell that knows which language is showing.
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="home" className="min-h-dvh">
      {children}
    </div>
  );
}
