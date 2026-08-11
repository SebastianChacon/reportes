import { fill, NoData, onFill } from "./Card";

/**
 * Part against whole, once.
 *
 * A pie of two slices is a bar that takes four times the room and is harder to
 * compare, so this is a bar. It is the right form for exactly the question this
 * screen keeps asking: how much of this was ours, and how much left the company.
 *
 * The percentage sits **inside** the segment only when it fits with padding on
 * both sides; below that it moves out to the row beneath. A label cropped by its
 * own bar is worse than no label, and `overflow: hidden` is not a solution, it
 * is the crop.
 */

export type Split = {
  label: string;
  oursLabel: string;
  theirsLabel: string;
  ours: number;
  theirs: number;
  /** Printed to the right of the title: the total, formatted. */
  totalLabel: string;
};

/** Below this share a percentage cannot sit inside its own segment. */
const FITS_INSIDE = 0.16;

export function SplitBar({ split }: { split: Split }) {
  const total = split.ours + split.theirs;
  if (total <= 0) return <NoData />;

  const oursShare = split.ours / total;
  const theirsShare = split.theirs / total;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-semibold">{split.label}</span>
        <span className="figure text-sm tabular-nums text-[color:var(--ink-muted)]">
          {split.totalLabel}
        </span>
      </div>

      <div className="flex overflow-hidden rounded-[6px]" style={{ gap: 2, height: 24 }}>
        <Segment
          share={oursShare}
          tone="ours"
          tip={`${split.oursLabel} · ${percent(oursShare)}`}
          rounded="left"
        />
        <Segment
          share={theirsShare}
          tone="theirs"
          tip={`${split.theirsLabel} · ${percent(theirsShare)}`}
          rounded="right"
        />
      </div>

      {/* The two values in words, always — the in-bar percentage is a
          convenience, and a segment too thin to hold one is exactly the case
          where the number matters most. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-[3px]"
            style={{ background: fill("ours") }}
          />
          <span className="text-[color:var(--ink-muted)]">{split.oursLabel}</span>
          <span className="figure font-semibold tabular-nums">{percent(oursShare)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-[3px]"
            style={{ background: fill("theirs") }}
          />
          <span className="text-[color:var(--ink-muted)]">{split.theirsLabel}</span>
          <span className="figure font-semibold tabular-nums">{percent(theirsShare)}</span>
        </span>
      </div>
    </div>
  );
}

function Segment({
  share,
  tone,
  tip,
  rounded,
}: {
  share: number;
  tone: "ours" | "theirs";
  tip: string;
  rounded: "left" | "right";
}) {
  if (share <= 0) return null;

  return (
    <div
      tabIndex={0}
      className={`viz-mark flex items-center justify-center ${
        rounded === "left" ? "rounded-l-[6px]" : "rounded-r-[6px]"
      }`}
      style={{ width: `${share * 100}%`, background: fill(tone) }}
    >
      <span className={`viz-tip ${rounded === "left" ? "viz-tip-start" : "viz-tip-end"}`} role="tooltip">
        {tip}
      </span>
      {share >= FITS_INSIDE && (
        // The one place text sits inside a mark. On solid ink it takes the
        // inverse and needs nothing else; on the hatch it cannot — text over a
        // hatch lands half on ink and half on gaps and is unreadable — so it
        // carries a small plate of the surface and stays in normal ink.
        <span
          className={`text-[11px] font-bold tabular-nums ${
            tone === "theirs" ? "rounded-[3px] px-1" : ""
          }`}
          style={{
            color: onFill(tone),
            ...(tone === "theirs" ? { background: "var(--surface-raised)" } : {}),
          }}
        >
          {percent(share)}
        </span>
      )}
    </div>
  );
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
