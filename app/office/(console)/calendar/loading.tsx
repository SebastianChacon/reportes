import { tc } from "@/lib/i18n";
import { Bar } from "@/components/office/Skeleton";

/**
 * The board, while it loads.
 *
 * The frame is drawn at close to its real height — twenty-odd lines — because
 * this is the tallest page in the console and a short placeholder would drop the
 * whole screen out from under the reader the moment the rows arrive.
 */
export default function LoadingBoard() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label={tc("loading")}>
      <Bar className="h-6 w-52" />
      <Bar className="h-3 w-96 max-w-full" />

      {/* `data-board-scale` so the placeholder's left block is exactly as wide
          as the real one — see the note on `--names` in `globals.css`. Without
          it the names would jump sideways the moment the board arrived. */}
      <div
        data-board-scale="week"
        className="rounded-[6px] p-[7px]"
        style={{ background: "var(--board-frame)" }}
      >
        <div className="board-surface flex flex-col gap-2 rounded-[3px] p-3">
          {Array.from({ length: 14 }, (_, at) => (
            <div key={at} className="grid gap-3 [grid-template-columns:var(--names)_minmax(0,1fr)]">
              <Bar className="h-4 w-full opacity-60" />
              {/* The bars are staggered rather than uniform: a column of
                  identical rectangles reads as a table that failed to load, not
                  as a schedule on its way. */}
              <Bar
                className="h-3 opacity-50"
                style={{ marginLeft: `${(at * 7) % 40}%`, width: `${18 + ((at * 11) % 34)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
