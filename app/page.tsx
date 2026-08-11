import type { Metadata, Viewport } from "next";
import { deskFonts } from "@/app/fonts";
import { officeAccess } from "@/lib/officeSession";
import { Portada, type AdminDoor } from "@/components/portada/Portada";

export const metadata: Metadata = {
  title: "Back to Nature",
  description: "Reporte de trabajo, o administración",
};

/**
 * The chooser follows the system into dark, so it says so per scheme. The root
 * layout no longer pins a colour — see the note there; each surface now
 * declares its own, and this is the one that sits on `/`.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * The front door.
 *
 * Never cached, because it reads the session cookie: whether the administration
 * card says "sign in" or "open" is a fact about the person asking, and a cached
 * answer would be a fact about whoever asked first.
 *
 * It deliberately does **not** query Convex. The overview at `/inicio` does,
 * because it prints the day's numbers; this screen prints two words and a
 * padlock, and that is why it stays the fastest page in the product — which
 * matters most on the connection a foreman has at 6am on a jobsite.
 */
export const dynamic = "force-dynamic";

export default async function ChooserPage() {
  const access = await officeAccess();

  // The three states are kept apart all the way to the screen because the
  // remedy differs: a live session needs no door at all, no session needs a
  // password, and an unconfigured server needs two environment variables and a
  // person who can set them. Collapsing them would send someone hunting for a
  // login on a server that has nothing to log in to.
  const admin: AdminDoor =
    access.state === "ok" ? "open" : access.state === "anonymous" ? "locked" : "unavailable";

  return (
    <div data-surface="home" className={`${deskFonts} min-h-dvh`}>
      <Portada admin={admin} />
    </div>
  );
}
