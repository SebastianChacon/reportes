import { tc } from "@/lib/i18n";
import { Bar, CardSkeleton } from "@/components/office/Skeleton";

/**
 * Search, while it loads.
 *
 * The filter card is drawn at its real height rather than skipped: it is the
 * tallest thing on this page, and a skeleton that omitted it would let the
 * results jump half a screen down the moment they arrived.
 */
export default function LoadingSearch() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={tc("loading")}>
      <div>
        <Bar className="h-6 w-44" />
        <Bar className="mt-2 h-3 w-80 max-w-full" />
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, at) => (
            <div key={at}>
              <Bar className="h-3 w-16" />
              <Bar className="mt-2 h-[52px] w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Bar className="mt-4 h-11 w-32 rounded-xl" />
      </div>

      <ul className="flex flex-col gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ul>
    </div>
  );
}
