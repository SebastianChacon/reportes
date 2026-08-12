import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Report — Back to Nature",
  description: "Daily job report / Reporte diario de trabajo",
};

/**
 * `theme-color` is deliberately absent here.
 *
 * It used to be pinned light, which was right when `/` was the wizard. It is
 * wrong now that `/` is the chooser and follows the system into dark: a fixed
 * light chrome above a dark page reads as a failed background. Each surface
 * declares its own instead — see `app/reporte/layout.tsx` (always light),
 * `app/inicio/layout.tsx` and `app/office/layout.tsx` (per scheme), and the
 * `viewport` export on the chooser itself.
 *
 * What stays is what every screen shares: the form is dense, so pinch-zoom must
 * remain available on all of them.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
