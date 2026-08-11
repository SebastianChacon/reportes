import Link from "next/link";
import { CONSOLE_LANG, tc } from "@/lib/i18n";
import { shortDate } from "@/lib/officeDate";
import { filedAtTime, hours, moneyExact } from "@/lib/officeFormat";
import { CardApprove } from "./CardApprove";
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

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };

/**
 * One report, as a line you can read without opening it.
 *
 * The whole card is the link. A PM scanning thirty of these at 5pm should not
 * have to find a small target inside each one, and "open the report" is the
 * only thing a card does.
 *
 * `showDate` is off on the day board, where every card is the same day and
 * printing it thirty times says nothing, and on in a search, where a list that
 * spans a month without naming the days is unreadable.
 */
export function ReportCard({
  card,
  showDate,
  approvable,
}: {
  card: Card;
  showDate?: boolean;
  /**
   * Adds the approve row under the card. On the day board, where a PM is
   * working through today's pile — not in a search, which is somebody looking
   * for one particular report rather than clearing a queue.
   */
  approvable?: boolean;
}) {
  const crewHours = hours(card.crewHours);
  const locale = LOCALE[CONSOLE_LANG] ?? "en-US";

  // The button cannot live inside the anchor — a button nested in a link is
  // invalid, and browsers disagree about which one a click belongs to. So the
  // card is the container, the link fills its body, and the action sits in a
  // row of its own underneath.
  //
  // The link only rounds the corners it actually owns. With a row below it, a
  // fully rounded link would leave two pale notches either side of the divider
  // the moment the card is hovered.
  const withRow = Boolean(approvable) && card.status !== "approved";

  return (
    <li className="card">
      <Link
        href={`/office/reportes/${card.id}`}
        className={`block p-4 transition hover:bg-[color:var(--accent-soft)] ${
          withRow ? "rounded-t-2xl" : "rounded-2xl"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-tight">{card.clientName}</h3>
            <p className="mt-0.5 truncate text-sm text-[color:var(--ink-muted)]">
              {showDate && <span className="font-medium">{shortDate(card.date, locale)} · </span>}
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
          <p className="notice mt-3 text-sm">
            <span className="font-semibold">{tc("sentBackNote")}:</span> {card.reviewNote}
          </p>
        )}
      </Link>

      {withRow && (
        <div className="no-print border-t border-[color:var(--line)] px-4 py-2.5">
          <CardApprove reportId={card.id} />
        </div>
      )}
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
