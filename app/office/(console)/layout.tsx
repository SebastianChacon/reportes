import { redirect } from "next/navigation";
import Link from "next/link";
import { officeAccess } from "@/lib/officeSession";
import { tc } from "@/lib/i18n";
import { ConsoleNav } from "@/components/office/ConsoleNav";
import { SignOutButton } from "@/components/office/SignOutButton";
import { Unconfigured } from "@/components/office/Unconfigured";

/**
 * Everything behind the door.
 *
 * The gate is here rather than in each page so that adding a screen cannot
 * accidentally add an ungated one — a new route under this folder is protected
 * by existing, and the sign-in page sits outside it precisely so it is not.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const access = await officeAccess();

  // Said plainly instead of rendering an empty day. An unconfigured console and
  // a day when nobody worked look identical, and only one of them is a bug.
  if (access.state === "unconfigured") return <Unconfigured missing={access.missing} />;
  if (access.state === "anonymous") redirect("/office/entrar");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
      <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[color:var(--surface-sunk)]/90 backdrop-blur">
        {/* Four things on one line at 375px is one too many, so the pieces that
            repeat themselves give way first: the "Office" eyebrow, and the
            brand, which on a phone says the same thing as the tab already
            highlighted next to it. Nothing wraps — a header that reflows into
            three lines pushes the day off the screen. */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          {/* The wordmark goes to the overview, not to the day — "The day" is
              the tab immediately to its right, so pointing both at the same
              screen would waste the one slot that can lead out of the console.
              It is hidden below `sm`, where the header has no room for it. */}
          <Link
            href="/inicio"
            className="hidden shrink-0 items-baseline gap-2 whitespace-nowrap rounded-md text-[15px] font-bold tracking-tight sm:flex"
          >
            {tc("company")}
            <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--ink-muted)] sm:inline">
              {tc("office")}
            </span>
          </Link>

          <ConsoleNav />

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-[color:var(--ink-muted)] lg:inline">
              {access.identity.name}
            </span>
            <SignOutButton label={tc("signOut")} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7">{children}</main>
    </div>
  );
}
