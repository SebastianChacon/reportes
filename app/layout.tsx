import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Report — Back to Nature",
  description: "Daily job report / Reporte diario de trabajo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The form is dense; pinch-zoom must stay available.
  maximumScale: 5,
  viewportFit: "cover",
  // Always light: the app stays white even when the OS/browser is in dark mode.
  themeColor: "#f4f4f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
