import { tc } from "@/lib/i18n";
import { CardSkeleton, StatSkeleton, Bar } from "@/components/office/Skeleton";

/**
 * The day, while it loads.
 *
 * Four numbers, the "not filed yet" panel, then reports — the same order and the
 * same heights the real screen uses, so nothing moves when the data lands.
 */
export default function LoadingDay() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={tc("loading")}>
      <Bar className="h-9 w-56 max-w-full rounded-lg" />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </dl>

      <section className="card p-4 sm:p-5">
        <Bar className="h-4 w-32" />
        <Bar className="mt-3 h-3 w-64 max-w-full" />
      </section>

      {/* Three, not thirty: enough to say "a list is coming" without drawing a
          page of grey the reader has to scroll past to reach the real one. */}
      <ul className="flex flex-col gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ul>
    </div>
  );
}
