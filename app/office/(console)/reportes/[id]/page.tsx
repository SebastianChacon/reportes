import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexServer } from "@/lib/convexServer";
import { CONSOLE_LANG, tc } from "@/lib/i18n";
import { endOfWeek, longDate, startOfWeek } from "@/lib/officeDate";
import { clockTime, filedAtTime, hours, moneyExact } from "@/lib/officeFormat";
import { Breadcrumb } from "@/components/office/Breadcrumb";
import {
  ApprovedStamp,
  FlagChips,
  StatusChip,
  type ReportStatus,
} from "@/components/office/chips";
import { Description } from "@/components/office/Description";
import { Warning } from "@/components/office/icons";
import { ReviewActions } from "@/components/office/ReviewActions";

/**
 * One report, whole.
 *
 * Laid out in the order the paper form is filled in, so a PM who has seen the
 * physical version knows where to look. Everything is read from what was stored
 * at write time — no total on this page is worked out here, because the number
 * next to it is already on a PDF in somebody's inbox.
 *
 * Two things the plan asked for are deliberately absent, and neither is an
 * oversight:
 *
 * - **Signatures.** `lib/types.ts` carries them on the phone, but they are not
 *   in `submittedReportFields`, so they never reach the database. They exist
 *   only inside the PDF the foreman sent. Showing an empty signature box would
 *   imply nobody signed.
 * - **Download PDF / resend by email.** Step E built the email rework and the
 *   link, and in doing so established why these two cannot follow: the PDF the
 *   foreman sent is not stored anywhere. Rebuilding one here would produce an
 *   unsigned document — the signatures never reach the database, per above — and
 *   handing a PM a PDF that differs from the one in his inbox is worse than
 *   handing him none. Both need a schema decision first, not a button. See
 *   PLAN-CONSOLA.md §7.
 */
export const dynamic = "force-dynamic";

const LOCALE: Record<string, string> = { en: "en-US", es: "es-US" };
const locale = LOCALE[CONSOLE_LANG] ?? "en-US";

/** Catalog labels arrive in both languages; the console reads one. */
function label(l10n: { en: string; es: string }): string {
  return l10n[CONSOLE_LANG];
}

/**
 * A crew member's week, opened on the week this report falls in rather than on
 * the current one — a report from last month is read to ask about last month.
 * The range is spelled out in the URL so the link says what it will show.
 */
function weekLinkFor(personId: string, date: string): string {
  const range = new URLSearchParams({ from: startOfWeek(date), to: endOfWeek(date) });
  return `/office/personas/${encodeURIComponent(personId)}?${range.toString()}`;
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const convex = convexServer();
  if (!convex) return null;

  // A pasted link with a mangled id must not reach Convex as an id — the client
  // throws on a malformed one, and this page is meant to be reachable by paste.
  const found = await loadReport(convex, id);
  if (found === null) return <NotHere />;

  const { report, foreman, reviewer, crewDays, photos } = found;
  const status = report.status as ReportStatus;

  return (
    <article className="flex flex-col gap-6">
      <div>
        {/* A breadcrumb rather than the lone "back to the day" arrow this used
            to carry. Same destination, and it still lands on the right day —
            but it also says where this page sits, which the arrow could not.
            That matters here more than anywhere: this is the page people arrive
            at from a link somebody sent them, with no history to go back to. */}
        <Breadcrumb
          trail={[
            { label: tc("navDay"), href: `/office?date=${report.date}` },
            { label: tc("crumbReport") },
          ]}
        />

        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{report.clientName}</h1>
            <p className="mt-0.5 text-sm text-[color:var(--ink-muted)]">
              {report.jobNumbers.length > 0 && (
                <>
                  {tc("jobShort")} {report.jobNumbers.join(" · ")} ·{" "}
                </>
              )}
              {longDate(report.date, locale)}
            </p>
          </div>

          {/* One document on one page, which is what buys the stamp its tilt.
              The chip is still rendered for an approved report — screen readers
              and a greyscale print both read the word, and the stamp beside it
              is `aria-hidden` decoration of the same fact. */}
          <div className="flex flex-wrap items-center gap-1.5">
            <FlagChips flags={report.flags} />
            {status === "approved" ? (
              <>
                <span className="sr-only">{tc("statusApproved")}</span>
                <ApprovedStamp />
              </>
            ) : (
              <StatusChip status={status} />
            )}
          </div>
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Pair
            label={tc("filedBy")}
            value={foreman?.name ?? tc("unattributed")}
            muted={foreman === null}
          />
          <Pair label={tc("filedAt")} value={filedAtTime(report.submittedAt, locale)} />
          {reviewer && <Pair label={tc("reviewedBy")} value={reviewer.name} />}
        </dl>
      </div>

      {/* The note the office wrote, above the report rather than under it: it is
          the reason this report is open. */}
      {status === "needs_review" && report.reviewNote && (
        <p className="notice px-4 py-3 text-[15px]">
          <span className="font-semibold">{tc("sentBackNote")}:</span> {report.reviewNote}
        </p>
      )}

      <ReviewActions reportId={report._id} status={status} />

      <Panel title={tc("sectionTimes")}>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          <Stat label={tc("leftYard")} value={clockTime(report.startYard, locale)} />
          <Stat label={tc("arrivedJob")} value={clockTime(report.startJob, locale)} />
          <Stat label={tc("leftJob")} value={clockTime(report.endJob, locale)} />
          <Stat label={tc("backYard")} value={clockTime(report.endYard, locale)} />
        </dl>
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[color:var(--line)] pt-3 text-sm">
          <Pair label={tc("dayHours")} value={hours(report.totals.dayHours) ?? "—"} />
          <Pair label={tc("onSite")} value={hours(report.totals.onSiteHours) ?? "—"} />
          <Pair label={tc("travel")} value={hours(report.totals.travelHours) ?? "—"} />
          <Pair label={tc("lunch")} value={`${report.lunchMinutes} min`} />
          <Pair label={tc("crewHours")} value={hours(report.totals.crewHours) ?? "—"} />
        </dl>
      </Panel>

      <Panel title={tc("sectionCrew")}>
        {crewDays.length === 0 ? (
          <Empty />
        ) : (
          <div className="scroll-x -mx-1 px-1">
            <table className="w-full min-w-[26rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--line)] text-left">
                  <Th>{tc("name")}</Th>
                  <Th>{tc("role")}</Th>
                  <Th align="right">{tc("hours")}</Th>
                </tr>
              </thead>
              <tbody>
                {crewDays.map((row) => (
                  <tr key={row._id} className="border-b border-[color:var(--line)] last:border-0">
                    <td className="py-2 pr-3 font-medium">
                      {/* A roster name opens that man's week — "how many hours
                          has he had" is the question this row provokes. A name
                          the foreman typed in has no history to open: it is a
                          name on one report, not a person. */}
                      {row.personId === null ? (
                        <>
                          {row.name}
                          <span className="ml-2 text-xs font-normal text-[color:var(--ink-muted)]">
                            {tc("notOnRoster")}
                          </span>
                        </>
                      ) : (
                        <Link
                          href={weekLinkFor(row.personId, report.date)}
                          title={tc("viewWeek")}
                          className="rounded-md underline decoration-[color:var(--line)] underline-offset-4 transition hover:decoration-[color:var(--ink)]"
                        >
                          {row.name}
                        </Link>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-[color:var(--ink-muted)]">
                      {row.roles.join(", ") || "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {/* Nobody wrote it down, which is not zero — and payroll
                          acts on the difference. */}
                      {hours(row.hours) ?? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold">
                          <Warning size={10} />
                          {tc("noHoursRecorded")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={tc("sectionWork")}>
        <Description description={report.description} />
        {report.notes.trim().length > 0 && (
          <div className="mt-4 border-t border-[color:var(--line)] pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
              {tc("notesLabel")}
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{report.notes}</p>
          </div>
        )}
      </Panel>

      <Resources report={report} />

      <Panel title={tc("sectionPhotos")}>
        {photos.length === 0 ? (
          <p className="text-sm text-[color:var(--ink-muted)]">{tc("noPhotos")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.id}>
                {photo.url === null ? (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-[color:var(--line)] p-2 text-center text-xs text-[color:var(--ink-muted)]">
                    {tc("photoMissing")}
                  </div>
                ) : (
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    title={tc("openPhoto")}
                    className="block overflow-hidden rounded-xl border border-[color:var(--line)]"
                  >
                    {/* Plain <img>: these are Convex storage URLs on a host the
                        image optimiser is not configured for, and a broken
                        optimiser means no photos at all. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </article>
  );
}

/* ------------------------------------------------------------------ */

async function loadReport(convex: NonNullable<ReturnType<typeof convexServer>>, id: string) {
  try {
    return await convex.query(api.office.report, { id: id as Id<"reports"> });
  } catch {
    // A malformed id is a bad link, not an outage. Both land on "not here",
    // which is the only thing the reader can do anything about.
    return null;
  }
}

function NotHere() {
  return (
    <div className="card p-6 text-center">
      <p className="font-semibold">{tc("notFound")}</p>
      <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{tc("notFoundHint")}</p>
      <Link
        href="/office"
        className="mt-4 inline-block rounded-lg border-[1.5px] border-[color:var(--line)] px-3 py-2 text-sm font-semibold transition hover:bg-[color:var(--accent-soft)]"
      >
        {tc("backToDay")}
      </Link>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label: name, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[color:var(--ink-muted)]">{name}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{value || "—"}</dd>
    </div>
  );
}

function Pair({ label: name, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <dt className="text-xs uppercase tracking-wide text-[color:var(--ink-muted)]">{name}</dt>
      <dd className={muted ? "italic text-[color:var(--ink-muted)]" : "font-semibold"}>{value}</dd>
    </span>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)] ${
        align === "right" ? "text-right" : "pr-3"
      }`}
    >
      {children}
    </th>
  );
}

function Empty() {
  return <p className="text-sm text-[color:var(--ink-muted)]">{tc("nothingRecorded")}</p>;
}

/**
 * Everything the crew used or moved.
 *
 * Each block is skipped entirely when empty rather than rendered as a heading
 * over "none". A report that used no subcontractors should be shorter, not
 * padded with the absence of them.
 */
function Resources({
  report,
}: {
  report: {
    equipment: { id: string; label: { en: string; es: string }; owner: string; qty: number | null; hours: number | null }[];
    materials: { id: string; label: { en: string; es: string }; source: string; qty: number | null; cost: number | null }[];
    plants: { id: string; category: string; name: string; qty: number | null; size: string; vendor: string; cost: number | null }[];
    subcontractors: { id: string; trade: string; tradeLabel: { en: string; es: string }; vendor: string; description: string }[];
    trucks: { id: string; label: { en: string; es: string }; hours: number | null }[];
    mileageTrips: number | null;
    mileageWhere: string;
    disposals: string;
    totals: { materialsCost: number };
  };
}) {
  const logistics =
    (report.mileageTrips !== null && report.mileageTrips > 0) ||
    report.mileageWhere.trim().length > 0 ||
    report.disposals.trim().length > 0;

  const anything =
    report.equipment.length > 0 ||
    report.materials.length > 0 ||
    report.plants.length > 0 ||
    report.subcontractors.length > 0 ||
    report.trucks.length > 0 ||
    logistics;

  if (!anything) {
    return (
      <Panel title={tc("sectionMaterials")}>
        <Empty />
      </Panel>
    );
  }

  return (
    <Panel title={tc("sectionMaterials")}>
      <div className="flex flex-col gap-4">
        {report.materials.length > 0 && (
          <Block title={tc("materials")}>
            <ul className="flex flex-col gap-1 text-sm">
              {report.materials.map((item) => (
                <Line
                  key={item.id}
                  name={label(item.label)}
                  // BTN stock versus bought-in is the difference between a cost
                  // that moves between departments and one that left the company.
                  note={item.source}
                  qty={item.qty}
                  cost={item.cost}
                />
              ))}
            </ul>
            <p className="mt-2 border-t border-[color:var(--line)] pt-2 text-sm font-semibold tabular-nums">
              {moneyExact(report.totals.materialsCost)}
            </p>
          </Block>
        )}

        {report.equipment.length > 0 && (
          <Block title={tc("equipment")}>
            <ul className="flex flex-col gap-1 text-sm">
              {report.equipment.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {label(item.label)}
                    <span className="ml-2 text-xs text-[color:var(--ink-muted)]">{item.owner}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-[color:var(--ink-muted)]">
                    {[item.qty !== null ? `×${item.qty}` : null, hours(item.hours)]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {report.plants.length > 0 && (
          <Block title={tc("plants")}>
            <ul className="flex flex-col gap-1 text-sm">
              {report.plants.map((item) => (
                <Line
                  key={item.id}
                  name={[item.name, item.size, item.vendor].filter(Boolean).join(" · ")}
                  qty={item.qty}
                  cost={item.cost}
                />
              ))}
            </ul>
          </Block>
        )}

        {report.subcontractors.length > 0 && (
          <Block title={tc("subcontractors")}>
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.subcontractors.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{label(item.tradeLabel) || item.trade}</span>
                  {item.vendor && (
                    <span className="text-[color:var(--ink-muted)]"> · {item.vendor}</span>
                  )}
                  {item.description && <p className="text-[color:var(--ink-muted)]">{item.description}</p>}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {report.trucks.length > 0 && (
          <Block title={tc("trucks")}>
            <ul className="flex flex-col gap-1 text-sm">
              {report.trucks.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{label(item.label)}</span>
                  <span className="shrink-0 tabular-nums text-[color:var(--ink-muted)]">
                    {hours(item.hours) ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {logistics && (
          <Block title={tc("mileage")}>
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {report.mileageTrips !== null && report.mileageTrips > 0 && (
                <Pair label={tc("trips")} value={String(report.mileageTrips)} />
              )}
              {report.mileageWhere.trim() && (
                <Pair label={tc("mileage")} value={report.mileageWhere} />
              )}
              {report.disposals.trim() && (
                <Pair label={tc("disposals")} value={report.disposals} />
              )}
            </dl>
          </Block>
        )}
      </div>
    </Panel>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Line({
  name,
  note,
  qty,
  cost,
}: {
  name: string;
  note?: string;
  qty: number | null;
  cost: number | null;
}) {
  return (
    <li className="flex justify-between gap-3">
      <span>
        {name}
        {note && <span className="ml-2 text-xs text-[color:var(--ink-muted)]">{note}</span>}
        {qty !== null && (
          <span className="ml-2 text-xs text-[color:var(--ink-muted)]">×{qty}</span>
        )}
      </span>
      {cost !== null && <span className="shrink-0 tabular-nums">{moneyExact(cost)}</span>}
    </li>
  );
}
