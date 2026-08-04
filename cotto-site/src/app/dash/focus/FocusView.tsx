"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type {
  FocusSnapshot,
  FocusItem,
  FocusBucketItem,
  FocusDecisionItem,
} from "@/lib/dash/focus-store";

type Props = {
  snapshot: FocusSnapshot | null;
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

function Section({ eyebrow, title, count, children }: { eyebrow?: string; title: string; count?: number; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-neutral-200 pt-7">
      {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-800">{eyebrow}</div>}
      <h2 className="mt-1 text-xl font-semibold text-neutral-900">
        {title}
        {count != null && <span className="ml-2 text-base font-normal text-neutral-400">· {count}</span>}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// The staged-draft pill. A draft is ALWAYS "ready (not sent)" — never rendered as
// sent or done. Kept unambiguous on purpose: a reply Claude prepared still needs
// Kendall's eyes and her send.
function DraftPill({ href }: { href?: string }) {
  const label = "draft ready · not sent";
  const cls =
    "inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800";
  if (!href) return <span className={cls}>✎ {label}</span>;
  return (
    <Link href={href} target="_blank" className={`${cls} hover:bg-amber-100`}>
      ✎ {label} →
    </Link>
  );
}

function ThreadLink({ href }: { href?: string }) {
  if (!href) return null;
  return (
    <Link href={href} target="_blank" className="text-[11px] font-medium text-cyan-700 hover:underline">
      open thread →
    </Link>
  );
}

// you-vs-them: who owes the next move. Loud coral when the ball is in Kendall's
// court, quiet neutral when we're waiting on them.
function OwesTag({ owes }: { owes: "you" | "them" }) {
  return owes === "you" ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
      you owe
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
      waiting on them
    </span>
  );
}

export default function FocusView({ snapshot, storeError }: Props) {
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
          No focus digest yet. The inbox sweep publishes one to{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5">POST /api/dash/focus</code> with the dash Bearer token.
        </div>
      </Shell>
    );
  }

  const s = snapshot;
  const nothingNeedsYou =
    s.focus.length === 0 &&
    s.buckets.respondNow.length === 0 &&
    s.buckets.canWait.length === 0 &&
    s.buckets.needsDecision.length === 0 &&
    s.buckets.fyi.length === 0;

  return (
    <Shell updatedAt={s.updatedAt}>
      {/* COVERAGE — every unread got read and sorted. */}
      <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
        ✓ {s.unreadCount.toLocaleString()} unread → all {s.categorizedCount.toLocaleString()} categorized
        <span className="ml-1 font-normal text-emerald-600">· triaged {timeAgo(s.updatedAt)}</span>
      </div>

      {/* COUNTS STRIP */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <CountChip label="focus" n={s.counts.focus} tone="cyan" />
        <CountChip label="respond now" n={s.counts.respondNow} tone="rose" />
        <CountChip label="needs a call" n={s.counts.needsDecision} tone="amber" />
        <CountChip label="can wait" n={s.counts.canWait} tone="neutral" />
        <CountChip label="fyi" n={s.counts.fyi} tone="neutral" />
        <CountChip label="no response" n={s.counts.noResponse} tone="neutral" />
      </div>

      {nothingNeedsYou ? (
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <div className="text-2xl">✓</div>
          <div className="mt-2 text-lg font-semibold text-neutral-900">Inbox triaged, nothing needs you right now.</div>
          <div className="mt-1 text-sm text-neutral-500">Everything is either handled or waiting on the other side.</div>
        </div>
      ) : (
        <>
          {/* HERO — the ranked focus list. The visual centerpiece. */}
          {s.focus.length > 0 && (
            <Section eyebrow="Do these first" title="Focus now">
              <ol className="space-y-3">
                {s.focus.map((f: FocusItem) => (
                  <li
                    key={f.rank}
                    className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-base font-bold text-white sm:h-9 sm:w-9">
                      {f.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-neutral-900">{f.who}</span>
                        {f.account && <span className="text-sm text-neutral-500">· {f.account}</span>}
                      </div>
                      <div className="mt-1 text-[15px] font-medium leading-snug text-neutral-900">{f.action}</div>
                      <div className="mt-0.5 text-sm leading-snug text-neutral-500">{f.why}</div>
                      {(f.draftUrl || f.threadUrl) && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-3">
                          {f.draftUrl && <DraftPill href={f.draftUrl} />}
                          <ThreadLink href={f.threadUrl} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* OWES ROLLUP — the short "you owe the move" line. */}
          {s.owesRollup.length > 0 && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span className="font-semibold">You owe the move on:</span>{" "}
              {s.owesRollup.join(" · ")}
            </div>
          )}

          {/* RESPOND NOW */}
          {s.buckets.respondNow.length > 0 && (
            <Bucket eyebrow="Today" title="Respond now" count={s.buckets.respondNow.length} items={s.buckets.respondNow} />
          )}

          {/* NEEDS YOUR CALL */}
          {s.buckets.needsDecision.length > 0 && (
            <Section eyebrow="Your judgment" title="Needs your call" count={s.buckets.needsDecision.length}>
              <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                {s.buckets.needsDecision.map((d: FocusDecisionItem, i) => (
                  <li key={i} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="shrink-0 text-sm font-semibold text-neutral-900 sm:w-40">{d.who}</span>
                    <span className="text-sm text-neutral-600">{d.question}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* CAN WAIT */}
          {s.buckets.canWait.length > 0 && (
            <Bucket eyebrow="Later" title="Can wait" count={s.buckets.canWait.length} items={s.buckets.canWait} collapsible />
          )}

          {/* FYI */}
          {s.buckets.fyi.length > 0 && (
            <Bucket eyebrow="No action" title="FYI" count={s.buckets.fyi.length} items={s.buckets.fyi} collapsible />
          )}
        </>
      )}
    </Shell>
  );
}

function CountChip({ label, n, tone }: { label: string; n: number; tone: "cyan" | "rose" | "amber" | "neutral" }) {
  const cls =
    tone === "cyan"
      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "amber"
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-neutral-200 bg-neutral-50 text-neutral-600";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      <span className="font-semibold tabular-nums">{n}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

// A compact one-line-per-item bucket. Optionally collapsible (can wait / FYI start
// collapsed so the page opens on what's urgent). Each row shows you-vs-them and any
// staged draft.
function Bucket({
  eyebrow,
  title,
  count,
  items,
  collapsible,
}: {
  eyebrow?: string;
  title: string;
  count: number;
  items: FocusBucketItem[];
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <Section eyebrow={eyebrow} title={title} count={count}>
      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-mt-2 mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-700"
        >
          <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
          {open ? "hide" : "show"}
        </button>
      )}
      {open && (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {items.map((it: FocusBucketItem, i) => (
            <li key={i} className="flex flex-col gap-1.5 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <OwesTag owes={it.owes} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-neutral-900">{it.who}</span>
                <span className="text-sm text-neutral-500"> — {it.what}</span>
              </div>
              {(it.draftUrl || it.threadUrl) && (
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {it.draftUrl && <DraftPill href={it.draftUrl} />}
                  <ThreadLink href={it.threadUrl} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Shell({ children, updatedAt }: { children: ReactNode; updatedAt?: string }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="text-lg font-semibold text-neutral-900">
            <span className="text-cyan-800">Cotto</span> · Focus
          </span>
          <span className="hidden text-xs text-neutral-400 sm:inline">Inbox triage, ranked</span>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/dash" className="text-neutral-500 hover:text-neutral-900">Dash</Link>
            <Link href="/dash/ops" className="text-neutral-500 hover:text-neutral-900">Ops</Link>
            <Link href="/dash/crm" className="text-neutral-500 hover:text-neutral-900">CRM</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold text-neutral-900">Today&apos;s focus</h1>
          <div className="text-xs text-neutral-400">
            {updatedAt ? <span className="rounded-full bg-neutral-100 px-2 py-0.5">refreshed {timeAgo(updatedAt)}</span> : null}
          </div>
        </div>
        {children}
        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Cotto — Dipsy LLC · internal. Drafts are staged, never sent — every send is Kendall&apos;s. Published by the inbox triage sweep.
        </footer>
      </main>
    </div>
  );
}
