import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * The two faces the desk surfaces are set in.
 *
 * The phone app is not among them, and that is the whole reason this lives in
 * its own module rather than in the root layout: a foreman opens the form on a
 * jobsite connection, and the console's typography is not worth a byte of that.
 * These are applied by `app/office/layout.tsx` and `app/inicio/layout.tsx`, so
 * the wizard keeps the system stack it has always had.
 *
 * Why these two, and not the sans everybody ships:
 *
 * **Archivo** is an American grotesque drawn for print and signage — the
 * lineage the job ticket this console is made of actually comes from. It holds
 * its shape at 12px in a table header, which is most of what this screen asks of
 * a typeface, and it is not Inter, which would have made the console look like
 * every other dashboard rather than like this company's paperwork.
 *
 * **IBM Plex Mono** carries every figure: hours, money, job numbers, dates,
 * report ids. In a monochrome design there is no colour to separate a number
 * from the words around it, so the number gets its own voice instead — and a
 * mono aligns columns for free, which a proportional face with tabular figures
 * only approximates.
 *
 * `display: "swap"` and self-hosting mean text is readable from the first paint
 * and the face swaps in without shifting layout.
 */
export const sans = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  // Variable font: one file covers the whole range this console uses, so asking
  // for the span costs nothing over asking for a single weight.
  weight: "variable",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  // Not variable upstream, so the weights are named. Three is all the console
  // uses: body figures, emphasised figures, and the stat tiles.
  weight: ["400", "500", "600"],
});

/** Put on the wrapper that opens a desk surface, beside `data-surface`. */
export const deskFonts = `${sans.variable} ${mono.variable}`;
