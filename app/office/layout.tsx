import type { Metadata, Viewport } from "next";
import { deskFonts } from "@/app/fonts";

export const metadata: Metadata = {
  title: "Office — Back to Nature",
  description: "Daily job reports, as the office reads them",
};

/**
 * The root layout pins `theme-color` light for the wizard, which is light in
 * every condition. The console is not, and until now it never said so — the
 * browser chrome stayed pale above a screen that had gone dark, which reads as
 * the page having failed to load its own background. `/inicio` already declared
 * this; the console had the same problem and no such line.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * The console's outermost shell.
 *
 * Two jobs, both of which have to sit above the sign-in page as well as the
 * gated screens: it opens the `office` design surface (which is what turns dark
 * mode on — the phone app underneath stays light in every condition), and it
 * marks the subtree as English.
 *
 * `lang` goes on a wrapper rather than on `<html>` because the root layout owns
 * that element and declares `es` for the field wizard. A nested `lang` is the
 * correct HTML for a document whose subtree is in another language, and it is
 * what a screen reader needs in order to switch voices at the right place.
 */
export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" data-surface="office" className={`${deskFonts} min-h-screen`}>
      {children}
    </div>
  );
}
