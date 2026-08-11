import { tc } from "@/lib/i18n";
import { Bar } from "@/components/office/Skeleton";

/**
 * One report, while it loads.
 *
 * The page a link from outside the building lands on, which makes it the one
 * most often opened cold — no warm cache, no prefetch, and somebody watching to
 * see whether the link worked.
 */
export default function LoadingReport() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={tc("loading")}>
      <div>
        <Bar className="h-4 w-40" />
        <Bar className="mt-3 h-7 w-64 max-w-full" />
        <Bar className="mt-2 h-3 w-52 max-w-full" />
      </div>

      {Array.from({ length: 3 }, (_, at) => (
        <section key={at} className="card p-4 sm:p-5">
          <Bar className="h-4 w-32" />
          <Bar className="mt-4 h-24 w-full" />
        </section>
      ))}
    </div>
  );
}
