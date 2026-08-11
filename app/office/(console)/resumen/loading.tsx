import { tc } from "@/lib/i18n";
import { Bar, ChartSkeleton, StatSkeleton } from "@/components/office/Skeleton";

/**
 * The summary, while it loads.
 *
 * This one earns its skeleton more than any other screen in the console: it runs
 * two full analytics reads before it can draw anything, so it is the longest
 * wait and the one most likely to be mistaken for a dead tab.
 */
export default function LoadingSummary() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={tc("loading")}>
      <div>
        <Bar className="h-6 w-48" />
        <Bar className="mt-2 h-3 w-72 max-w-full" />
      </div>

      <Bar className="h-11 w-full max-w-md rounded-xl" />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </dl>

      <ChartSkeleton />
      <ChartSkeleton height={120} />
      <ChartSkeleton height={140} />
    </div>
  );
}
