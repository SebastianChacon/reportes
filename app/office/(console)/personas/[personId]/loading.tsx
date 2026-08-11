import { tc } from "@/lib/i18n";
import { Bar, StatSkeleton } from "@/components/office/Skeleton";

/** One person's week, while it loads. Three numbers, then a day per card. */
export default function LoadingPerson() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={tc("loading")}>
      <Bar className="h-4 w-32" />
      <Bar className="h-9 w-64 max-w-full rounded-lg" />

      <dl className="grid grid-cols-3 gap-3">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </dl>

      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, at) => (
          <li key={at} className="card p-4">
            <Bar className="h-4 w-32" />
            <Bar className="mt-4 h-12 w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
