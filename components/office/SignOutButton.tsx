"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/office", { method: "DELETE", credentials: "same-origin" });
        } catch {
          // The cookie outlives a failed request; the gate will send them to
          // sign in again on the next navigation either way.
        }
        // `refresh` before `replace` so the layout re-runs its gate against the
        // cleared cookie rather than serving the signed-in shell from cache.
        router.refresh();
        router.replace("/office/entrar");
      }}
      className="min-h-9 whitespace-nowrap rounded-lg border-[1.5px] border-[color:var(--line)] px-3 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)] disabled:opacity-50"
    >
      {label}
    </button>
  );
}
