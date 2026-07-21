"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { OpsSnapshot, OpsLot, OpsOrder, OpsLedgerRow, OpsRun, OpsHistoryRow, OpsPackagingComponent } from "@/lib/dash/ops-store";

type Props = {
  snapshot: OpsSnapshot | null;
  storeError: string | null;
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function statusChip(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("submit") || s.includes("deliver")) return "bg-emerald-50 text-emerald-700";
  if (s.includes("unconfirm") || s.includes("verify")) return "bg-red-50 text-red-700";
  if (s.includes("to deliver") || s.includes("pending")) return "bg-amber-50 text-amber-700";
  return "bg-neutral-100 text-neutral-600";
}

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-8 border-t border-neutral-200 pt-7">
      {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-800">{eyebrow}</div>}
      <h2 className="mt-1 text-xl font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={`whitespace-nowrap bg-neutral-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
function Td({ children, right, muted }: { children: ReactNode; right?: boolean; muted?: boolean }) {
  return (
    <td className={`whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-sm tabular-nums ${right ? "text-right" : "text-left"} ${muted ? "text-neutral-400" : "text-neutral-800"}`}>
      {children}
    </td>
  );
}

// A subtotal-style row for market positions that are NOT warehouse best-by lots
// (Meraki in-market, inbound in production). Case totals only — no per-SKU or best-by.
function SummaryRow({ label, title, cases }: { label: string; title: string; cases: number }) {
  return (
    <tr className="bg-neutral-50 italic text-neutral-500" title={title}>
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-sm font-medium">{label}</td>
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-sm" />
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-right text-sm">—</td>
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-right text-sm">—</td>
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-right text-sm">—</td>
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-right text-sm tabular-nums font-semibold">{cases.toLocaleString()}</td>
      <td className="whitespace-nowrap border-t border-neutral-200 px-3 py-2 text-sm" colSpan={3} />
    </tr>
  );
}

export default function OpsView({ snapshot, storeError }: Props) {
  if (storeError) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Storage error: {storeError}
        </div>
      </Shell>
    );
  }
  if (!snapshot) {
    return (
      <Shell>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          No ops snapshot yet. Run <code className="rounded bg-neutral-100 px-1.5 py-0.5">node emit-ops-snapshot.js</code> from the local pipeline to publish one.
        </div>
      </Shell>
    );
  }

  const s = snapshot;
  return (
    <Shell asOf={s.asOf} updatedAt={s.updatedAt}>
      {/* FRESHNESS — is the Gmail capture still running? Loud when it isn't. */}
      <FreshnessBanner freshness={s.freshness} packagingStaleNote={s.packaging?.staleNote} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="On hand" value={s.onHand.total} unit={`cs · Bklyn ${s.location.brooklyn} + Edison ${s.location.edison}`} accent="cyan" />
        <Kpi label="With Meraki" value={s.location.meraki} unit="cs · in market" accent="emerald" />
        <Kpi label="Inbound" value={s.location.inbound} unit="cs · 7/13 run" accent="amber" />
        <Kpi label="BUF / FO / GR" value={`${s.onHand.buf}/${s.onHand.fo}/${s.onHand.gr}`} unit="cases on hand" accent="neutral" />
      </div>

      {/* LOTS */}
      <Section id="inventory" eyebrow="Where it is" title="Inventory by lot & shelf life">
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Lot</Th><Th>Loc</Th><Th right>BUF</Th><Th right>FO</Th><Th right>GR</Th><Th right>Cases</Th>
                <Th>Best-by</Th><Th>Meraki until</Th><Th>Direct until</Th>
              </tr>
            </thead>
            <tbody>
              {s.lots.map((l: OpsLot, i) => (
                <tr key={i}>
                  <Td>{l.name}</Td>
                  <Td muted>{l.location}</Td>
                  <Td right>{l.buf}</Td><Td right>{l.fo}</Td><Td right>{l.gr}</Td>
                  <Td right><span className="font-semibold">{l.cases}</span></Td>
                  <Td>{l.bestBy}</Td>
                  <Td muted>{l.merakiUntil ?? "—"}</Td>
                  <Td muted>{l.directUntil ?? "—"}</Td>
                </tr>
              ))}
              {/* Summary rows — NOT warehouse best-by lots. Case totals only, from location counts. */}
              {s.location.meraki > 0 && (
                <SummaryRow label="Meraki — in market" title="Cases with Meraki Direct, per Meraki's report" cases={s.location.meraki} />
              )}
              {s.location.inbound > 0 && (
                <SummaryRow label="Inbound — in production" title="Cases produced but not yet landed at a warehouse" cases={s.location.inbound} />
              )}
            </tbody>
          </table>
        </div>
        {s.directFloorDays != null && (
          <p className="mt-2 text-xs text-neutral-500">
            Meraki floor 30 days; direct-door floor {s.directFloorDays} days. Meraki gets fresh lots; direct doors (Carriacou / Localee) take the aging stock.
          </p>
        )}
      </Section>

      {/* PACKAGING REORDER */}
      {s.packaging && s.packaging.components.length > 0 && (
        <Section id="packaging" eyebrow="Order before we run out" title="Packaging — reorder">
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Component</Th><Th>Supplier</Th><Th right>On hand</Th><Th>Reorder by</Th><Th right>Order qty</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {s.packaging.components.map((c: OpsPackagingComponent, i) => (
                  <tr key={i}>
                    <Td>{c.label}</Td>
                    <Td muted>{c.supplier}</Td>
                    <Td right>{c.onHand.toLocaleString()}</Td>
                    <Td>{c.reorderBy ?? "—"}</Td>
                    <Td right><span className="font-semibold">{c.orderQty ? c.orderQty.toLocaleString() : "—"}</span></Td>
                    <td className="border-t border-neutral-100 px-3 py-2">
                      {/* The ACTION, not the alarm level. "RED" on 8 of 9 components told you
                          nothing; ORDER vs LATE tells you whether to cut a PO or chase a supplier. */}
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          c.action === "ORDER"
                            ? "bg-red-50 text-red-700"
                            : c.action === "LATE"
                              ? "bg-orange-50 text-orange-800"
                              : c.action === "WATCH"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {c.action ?? c.status}
                      </span>
                      {c.action === "LATE" && c.lateFor && (
                        <div className="mt-0.5 text-[11px] font-normal text-orange-700">
                          ordered, lands {c.lateFor.receipt} · {c.lateFor.run} runs {c.lateFor.on}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.packaging.staleNote && (
            <p className="mt-2 text-xs text-amber-700">⚠ {s.packaging.staleNote}</p>
          )}
        </Section>
      )}

      {/* ORDERS */}
      <Section id="orders" eyebrow="This week" title="Open orders — by channel">
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr><Th>Account</Th><Th>Channel</Th><Th right>BUF/FO/GR</Th><Th right>Cases</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {s.orders.map((o: OpsOrder, i) => (
                <tr key={i}>
                  <Td>{o.account}</Td>
                  <Td muted>{o.channel}</Td>
                  <Td right>{o.buf ?? "—"} / {o.fo ?? "—"} / {o.gr ?? "—"}</Td>
                  <Td right>{o.cases ?? "—"}</Td>
                  <td className="border-t border-neutral-100 px-3 py-2">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusChip(o.status)}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* LEDGER */}
      <Section id="ledger" eyebrow="How we know" title="Reconciliation ledger">
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr><Th>Date</Th><Th>Movement</Th><Th right>BUF</Th><Th right>FO</Th><Th right>GR</Th><Th right>Total</Th><Th>Source</Th></tr>
            </thead>
            <tbody>
              {s.ledger.map((r: OpsLedgerRow, i) => (
                <tr key={i} className={r.excluded ? "text-neutral-400" : ""}>
                  <Td muted={r.excluded}>{r.date}</Td>
                  <Td muted={r.excluded}>{r.label}</Td>
                  <Td right muted={r.excluded}>{r.buf ?? ""}</Td>
                  <Td right muted={r.excluded}>{r.fo ?? ""}</Td>
                  <Td right muted={r.excluded}>{r.gr ?? ""}</Td>
                  <Td right muted={r.excluded}>{r.total}</Td>
                  <Td muted>{r.source}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* PIPELINE + AUGUST */}
      <Section id="pipeline" eyebrow="What we've made & what's next" title="Production pipeline">
        <RunsTable runs={s.pipeline} />
        {s.augustPlan && (
          <div className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-neutral-900">August plan (draft)</h3>
              {s.augustPlan.dueDate && <span className="text-xs font-medium text-red-600">Due Nathan {s.augustPlan.dueDate}</span>}
            </div>
            <RunsTable runs={s.augustPlan.runs} />
            <p className="mt-2 text-sm text-neutral-600">
              {s.augustPlan.totalBatches} batches · ~{s.augustPlan.totalCases.toLocaleString()} cs.{s.augustPlan.note ? ` ${s.augustPlan.note}` : ""}
            </p>
          </div>
        )}
      </Section>

      {/* HISTORY */}
      {s.history && s.history.length > 0 && (
        <Section id="history" eyebrow="Learn from the past" title="Sell-in history">
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr><Th>Month</Th><Th right>Shipped</Th><Th right>Mix (B/F/G)</Th><Th>Signal</Th></tr>
              </thead>
              <tbody>
                {s.history.map((h: OpsHistoryRow, i) => (
                  <tr key={i}>
                    <Td>{h.month}</Td><Td right>{h.shipped}</Td><Td right muted>{h.mix ?? "—"}</Td><Td muted>{h.signal ?? ""}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {s.notes && s.notes.length > 0 && (
        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          <ul className="list-disc space-y-1 pl-5">
            {s.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {/* PLANNING FLAGS — monthly diagnostics, de-emphasized at the bottom, collapsed by default */}
      {s.flags && s.flags.length > 0 && <PlanningFlags flags={s.flags} />}
    </Shell>
  );
}

// Top-of-page capture-freshness banner. Quiet green when the sweep ran today/yesterday
// (staleDays <= 1); loud amber (2-3 days) or red (>3 days) when the Gmail-dependent capture
// hasn't run — the failure mode that once froze silently for a week. Also echoes the
// packaging/count staleness up top so both staleness signals are visible before any number.
function FreshnessBanner({
  freshness,
  packagingStaleNote,
}: {
  freshness?: OpsSnapshot["freshness"];
  packagingStaleNote?: string;
}) {
  const hasFreshness = freshness && freshness.staleDays != null;
  const days = freshness?.staleDays ?? null;
  const stale = days != null && days > 1;
  const level = days != null && days > 3 ? "red" : "amber"; // loudness tier for stale

  return (
    <div className="mb-5 space-y-2">
      {!hasFreshness ? (
        <div className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-600">
          Capture freshness unknown — no <code className="rounded bg-neutral-100 px-1 py-0.5">freshness</code> in this snapshot. Re-run{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5">emit-ops-snapshot.js</code>.
        </div>
      ) : stale ? (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
            level === "red" ? "border-red-400 bg-red-50 text-red-800" : "border-amber-400 bg-amber-50 text-amber-900"
          }`}
        >
          ⚠ Last swept {days} days ago{freshness!.lastSwept ? ` (${freshness!.lastSwept})` : ""} — capture hasn't run.
          <span className="ml-1 font-normal">
            New orders, deliveries, and receipts may be missing from this view. Run the order desk or the daily brief to resweep.
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
          ✓ Swept {days === 0 ? "today" : "yesterday"}
          {freshness!.lastSwept ? ` · latest movement ${freshness!.lastSwept}` : ""} — capture is current.
        </div>
      )}
      {freshness?.sources && <SourceFreshnessStrip sources={freshness.sources} />}
      {packagingStaleNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          ⚠ {packagingStaleNote}
        </div>
      )}
    </div>
  );
}

// Per-source freshness chips: one per input the sweep pulls (gmail, settle, texts, slips,
// calendar, meraki), each green/amber/red by its own staleness so a single quiet channel is
// visible at a glance. A source with no local cache (calendar is live-queried) shows grey. Slips
// go red on a backlog (photos arrived but unread) even with no processed date.
function SourceFreshnessStrip({
  sources,
}: {
  sources: NonNullable<NonNullable<OpsSnapshot["freshness"]>["sources"]>;
}) {
  const ORDER = ["gmail", "settle", "texts", "slips", "meraki", "calendar"];
  const keys = Object.keys(sources).sort((a, b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const tone = (s: (typeof sources)[string]): "green" | "amber" | "red" | "grey" => {
    if (s.backlog) return "red";
    if (s.staleDays == null) return "grey";
    if (s.staleDays > 3) return "red";
    if (s.staleDays > 1) return "amber";
    return "green";
  };
  const cls: Record<string, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-300 bg-amber-50 text-amber-900",
    red: "border-red-300 bg-red-50 text-red-800",
    grey: "border-neutral-200 bg-neutral-50 text-neutral-500",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => {
        const s = sources[k];
        const t = tone(s);
        const detail = s.backlog
          ? "backlog"
          : s.staleDays == null
            ? s.note
              ? "live"
              : "—"
            : s.staleDays === 0
              ? "today"
              : `${s.staleDays}d`;
        return (
          <span
            key={k}
            title={
              (s.lastIngested ? `last: ${s.lastIngested}` : "no local cache") +
              (s.lastArrived ? ` · arrived: ${s.lastArrived}` : "") +
              (s.note ? ` · ${s.note}` : "")
            }
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls[t]}`}
          >
            <span className="font-semibold">{k}</span>
            <span className="opacity-70">{detail}</span>
          </span>
        );
      })}
    </div>
  );
}

// First sentence/clause of a flag, for the collapsed one-line preview. Splits on the first
// sentence end or the em/colon boundary the engine uses to lead its longer callouts.
function firstClause(text: string): string {
  const m = text.match(/^(.*?[.:])\s/);
  const clause = (m ? m[1] : text).trim();
  return clause.length > 140 ? clause.slice(0, 137).trimEnd() + "…" : clause;
}

function PlanningFlags({ flags }: { flags: NonNullable<OpsSnapshot["flags"]> }) {
  const [open, setOpen] = useState(false);
  const redCount = flags.filter((f) => f.level === "red").length;
  return (
    <section className="mt-10 border-t border-neutral-200 pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-700"
      >
        <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        Planning flags ({flags.length})
        {redCount > 0 && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">{redCount} red</span>}
        <span className="ml-1 font-normal normal-case tracking-normal text-neutral-400">monthly S&amp;OP diagnostics — not daily to-dos</span>
      </button>
      {open ? (
        <div className="mt-4 space-y-2">
          {flags.map((f, i) => (
            <details key={i} className={`group rounded-lg border px-3 py-2 text-sm ${f.level === "red" ? "border-red-200 bg-red-50" : f.level === "amber" ? "border-amber-200 bg-amber-50" : "border-neutral-200 bg-neutral-50"}`}>
              <summary className="flex cursor-pointer list-none items-start gap-2">
                <FlagChip level={f.level} />
                <span className={`flex-1 ${f.level === "red" ? "text-red-800" : f.level === "amber" ? "text-amber-900" : "text-neutral-700"}`}>
                  {firstClause(f.text)}
                </span>
                <span className="mt-0.5 shrink-0 text-[11px] font-medium text-neutral-400 group-open:hidden">details</span>
              </summary>
              <p className={`mt-2 whitespace-pre-wrap text-[13px] leading-relaxed ${f.level === "red" ? "text-red-700" : f.level === "amber" ? "text-amber-800" : "text-neutral-600"}`}>
                {f.text}
              </p>
            </details>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {flags.map((f, i) => (
            <span key={i} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${f.level === "red" ? "bg-red-50 text-red-700" : f.level === "amber" ? "bg-amber-50 text-amber-800" : "bg-neutral-100 text-neutral-500"}`}>
              <FlagChip level={f.level} />
              {firstClause(f.text)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function FlagChip({ level }: { level: "red" | "amber" | "info" }) {
  const cls = level === "red" ? "bg-red-500" : level === "amber" ? "bg-amber-500" : "bg-neutral-400";
  return <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} aria-label={level} />;
}

function RunsTable({ runs }: { runs: OpsRun[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr><Th>Run</Th><Th right>B / F / G</Th><Th right>Cases</Th><Th>Lands</Th><Th>Best-by</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {runs.map((r: OpsRun, i) => (
            <tr key={i}>
              <Td>{r.run}</Td>
              <Td right muted>{r.batches}</Td>
              <Td right>{r.cases}</Td>
              <Td muted>{r.lands ?? "—"}</Td>
              <Td muted>{r.bestBy ?? "—"}</Td>
              <td className="border-t border-neutral-100 px-3 py-2">
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusChip(r.status)}`}>{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({ label, value, unit, accent }: { label: string; value: number | string; unit: string; accent: string }) {
  const bar =
    accent === "cyan" ? "bg-cyan-700" : accent === "emerald" ? "bg-emerald-600" : accent === "amber" ? "bg-amber-500" : "bg-neutral-400";
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-bold leading-none tabular-nums text-neutral-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="mt-1 text-xs text-neutral-500">{unit}</div>
    </div>
  );
}

function Shell({ children, asOf, updatedAt }: { children: ReactNode; asOf?: string; updatedAt?: string }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <span className="text-lg font-semibold text-neutral-900">
            <span className="text-cyan-800">Cotto</span> · Ops
          </span>
          <span className="hidden text-xs text-neutral-400 sm:inline">Inventory &amp; production command center</span>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/dash" className="text-neutral-500 hover:text-neutral-900">Dash</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold text-neutral-900">Ops command center</h1>
          <div className="text-xs text-neutral-400">
            {asOf ? <>As of {asOf}</> : null}
            {updatedAt ? <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5">refreshed {timeAgo(updatedAt)}</span> : null}
          </div>
        </div>
        {children}
        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Cotto — Dipsy LLC · internal. Cases = 6-packs (8&nbsp;oz). Auto-published from the spine by cotto-pipeline/emit-ops-snapshot.js.
        </footer>
      </main>
    </div>
  );
}
