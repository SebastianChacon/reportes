import { tc } from "@/lib/i18n";

/**
 * Shown when the server is missing what the console needs to run.
 *
 * This exists because of the specific failure PLAN-CONSOLA.md §8 names: a
 * console pointed at nothing shows zero reports and zero missing foremen, which
 * is exactly what a correctly working console shows on a day when nobody
 * worked. One of those is a quiet misconfiguration and the other is Sunday, and
 * a screen that cannot tell you which is worse than no screen.
 *
 * The variable names are printed rather than logged. Whoever sees this is the
 * person who can fix it, and the fix is two lines of deployment config.
 */
export function Unconfigured({ missing }: { missing: string[] }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-10">
      <div className="card p-6">
        <h1 className="text-lg font-bold tracking-tight">{tc("unconfigured")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-muted)]">
          {tc("unconfiguredHint")}
        </p>
        {missing.length > 0 && (
          <p className="mt-4 text-sm">
            <span className="font-semibold">{tc("unconfiguredMissing")}</span>{" "}
            <code
              translate="no"
              className="rounded bg-[color:var(--accent-soft)] px-1.5 py-0.5 font-mono text-[13px] font-semibold"
            >
              {missing.join(" · ")}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}
