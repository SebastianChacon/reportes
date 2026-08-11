import { tc } from "@/lib/i18n";
import { Bar } from "@/components/office/Skeleton";

/** The advanced summary, while it loads: two big tables and the controls above them. */
export default function LoadingAdvanced() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={tc("loading")}>
      <div>
        <Bar className="h-4 w-40" />
        <Bar className="mt-3 h-7 w-56" />
        <Bar className="mt-2 h-3 w-80 max-w-full" />
      </div>

      <Bar className="h-11 w-full max-w-md rounded-xl" />

      {Array.from({ length: 2 }, (_, at) => (
        <section key={at} className="card p-4 sm:p-5">
          <Bar className="h-4 w-36" />
          <Bar className="mt-4 h-64 w-full" />
        </section>
      ))}
    </div>
  );
}
