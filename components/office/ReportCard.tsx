import Link from "next/link";
import { tc } from "@/lib/i18n";
import { filedAtTime, hours, moneyExact } from "@/lib/officeFormat";
import { FlagChips, StatusChip, type ReportStatus } from "./chips";

export type Card = {
  id: string;
  date: string;
  clientName: string;
  jobNumbers: string[];
  foreman: { userId: string; name: string } | null;
  dayHours: number | null;
  crewHours: number;
  crewSize: number;
  materialsCost: number;
  status: ReportStatus;
  flags: { key: string; field: string | null }[];
  photoCount: number;
  submittedAt: string;
  reviewNote: string | null;
};

/**
 * One report, as a line you can read without opening it.
 *
 * The whole card is the link. A PM scanning thirty of these at 5pm should not
 * have to find a small target inside each one, and "open the report" is the
 * only thing a card does.
 */
export function ReportCard({ card }: { card: Card }) {
  const crewHours = hours(card.crewHours);

  return (
    <li>
      <Link
        href={`/office/reportes/${card.id}`}
        className="card block p-4 transition hover:border-[color:var(--ink-muted)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-tight">{card.clientName}</h3>
            <p className="mt-0.5 truncate text-sm text-[color:var(--ink-muted)]">
              {card.jobNumbers.length > 0
                ? `${tc("jobShort")} ${card.jobNumbers.join(" · ")}`
                : tc("nothingRecorded")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <FlagChips flags={card.flags} />
            <StatusChip status={card.status} />
          </div>
        </div>

        <dl className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <Fact
            label={tc("filedBy")}
            value={card.foreman?.name ?? tc("unattributed")}
            muted={card.foreman === null}
          />
          {crewHours && <Fact label={tc("hours")} value={crewHours} />}
          <Fact label={tc("people")} value={String(card.crewSize)} />
          {card.materialsCost > 0 && (
            <Fact label={tc("cost")} value={moneyExact(card.materialsCost)} />
          )}
          {card.photoCount > 0 && (
            <Fact label={tc("photos")} value={String(card.photoCount)} />
          )}
          <span className="ml-auto shrink-0 text-xs text-[color:var(--ink-muted)]">
            {filedAtTime(card.submittedAt)}
          </span>
        </dl>

        {/* The note the office wrote, on the card — a report that was sent back
            should say why without being opened, or it reads as merely late. */}
        {card.status === "needs_review" && card.reviewNote && (
          <p className="mt-3 border-l-2 border-[color:var(--warn)] bg-[color:var(--warn-soft)] px-3 py-2 text-sm text-[color:var(--ink)]">
            <span className="font-semibold">{tc("sentBackNote")}:</span> {card.reviewNote}
          </p>
        )}
      </Link>
    </li>
  );
}

function Fact({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <dt className="text-xs uppercase tracking-wide text-[color:var(--ink-muted)]">{label}</dt>
      <dd className={muted ? "text-[color:var(--ink-muted)] italic" : "font-semibold"}>{value}</dd>
    </span>
  );
}
