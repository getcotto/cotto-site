"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { WeekSnapshot, WeekRow } from "@/lib/dash/week-store";

type Props = {
  snapshot: WeekSnapshot | null;
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

function dueLabel(r: WeekRow): string {
  if (!r.dueDate) return "";
  const parts = String(r.dueDate).split("-");
  const md = parts.length === 3 ? `${+parts[1]}/${+parts[2]}` : r.dueDate;
  return r.dueDow ? `${r.dueDow} ${md}` : md;
}

// One tier block. `tone` drives the accent so the three tiers read at a glance, and the stale flag
// softens the red tier to amber (mirrors the push: when data is unverified, a red is "check," not "act").
function Tier({
  title,
  rows,
  tone,
  emptyOk,
}: {
  title: string;
  rows: WeekRow[];
  tone: "red" | "amber" | "blue";
  emptyOk?: boolean;
}) {
  if (!rows.length && emptyOk) return null;
  const accent =
    tone === "red"
      ? "text-red-700 border-red-200"
      : tone === "amber"
        ? "text-amber-700 border-amber-200"
        : "text-cyan-800 border-cyan-200";
  return (
    <section className="mt-6">
      <h2 className={`text-[11px] font-bold uppercase tracking-[0.14em] ${accent.split(" ")[0]}`}>{title}</h2>
      <ul className="mt-2 space-y-2">
        {rows.map((r, i) => (
          <li key={r.key ?? i} className={`rounded-lg border bg-white px-4 py-3 ${accent.split(" ")[1]}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-neutral-900">{r.step}</span>
              {r.dueDate ? (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">by {dueLabel(r)}</span>
              ) : null}
            </div>
            {r.why ? <p className="mt-1 text-sm leading-snug text-neutral-500">{r.why}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function WeekView({ snapshot, storeError }: Props) {
  const s = snapshot;
  const stale = !!s?.stale;
  const nothing = s && !s.today.length && !s.motion.length && !s.call.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="text-lg font-semibold text-neutral-900">
            <span className="text-cyan-800">Cotto</span> · This Week
          </span>
          <span className="hidden text-xs text-neutral-400 sm:inline">What needs you, and when</span>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/dash/ops" className="text-neutral-500 hover:text-neutral-900">Ops</Link>
            <Link href="/dash" className="text-neutral-500 hover:text-neutral-900">Dash</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold text-neutral-900">This Week</h1>
          <div className="text-xs text-neutral-400">
            {s?.asOf ? <>As of {s.asOf}</> : null}
            {s?.updatedAt ? <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5">refreshed {timeAgo(s.updatedAt)}</span> : null}
          </div>
        </div>

        {storeError ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Storage unavailable: {storeError}</p>
        ) : !s ? (
          <p className="mt-6 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
            No cadence published yet. The spine publisher (emit_week_snapshot.js) posts it each morning.
          </p>
        ) : (
          <>
            {stale ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ⚠ Data {s.freshness?.ageDays ?? "?"}d stale{s.freshness?.oldestInput ? ` (since ${s.freshness.oldestInput})` : ""} — numbers unverified. Treat a red as &ldquo;check,&rdquo; not &ldquo;act.&rdquo;
              </p>
            ) : null}

            {nothing ? (
              <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                ✅ Nothing needs you today.{s.next ? ` Next up: ${s.next.step}${s.next.dueDate ? ` (${dueLabel(s.next)})` : ""}.` : ""}
              </p>
            ) : (
              <>
                <Tier title={stale ? "Check today (data unverified)" : "Needs you today"} rows={s.today} tone={stale ? "amber" : "red"} emptyOk />
                <Tier title="In motion" rows={s.motion} tone="blue" emptyOk />
                <Tier title={stale ? "Your call (data unverified)" : "Your call"} rows={s.call} tone="amber" emptyOk />
              </>
            )}

            {s.doneCount ? <p className="mt-8 text-xs text-neutral-400">{s.doneCount} done this week.</p> : null}
          </>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Cotto — Dipsy LLC · internal. The same cadence the daily push sends, computed once by the spine engine and rendered here — a pure view, nothing recomputed.
        </footer>
      </main>
    </div>
  );
}
