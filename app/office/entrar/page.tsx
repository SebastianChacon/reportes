import { redirect } from "next/navigation";
import { officeAccess } from "@/lib/officeSession";
import { Unconfigured } from "@/components/office/Unconfigured";
import { SignInForm } from "@/components/office/SignInForm";

/**
 * The console's door.
 *
 * Outside the `(console)` group on purpose — it is the one office page that
 * cannot be behind the gate, and keeping it out of that folder means the gate
 * needs no exception carved into it.
 */
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const access = await officeAccess();

  // Offering a form that cannot possibly succeed is worse than saying why.
  if (access.state === "unconfigured") return <Unconfigured missing={access.missing} />;
  if (access.state === "ok") redirect("/office");

  return <SignInForm />;
}
