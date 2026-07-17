"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { CrmSnapshot, CrmAccount, CrmFlag, CrmReview } from "@/lib/dash/crm-store";

type Props = {
  snapshot: CrmSnapshot | null;
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

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(parts[1]) - 1]} ${Number(parts[2])} '${parts[0].slice(2)}`;
}

const STAGE_CHIP: Record<string, string> = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "in-talks": "bg-cyan-50 text-cyan-800 ring-cyan-200",
  target: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  passed: "bg-neutral-100 text-neutral-400 ring-neutral-200",
};

const TYPE_CHIP: Record<string, string> = {
  retailer: "bg-indigo-50 text-indigo-700",
  distributor: "bg-amber-50 text-amber-800",
  broker: "bg-fuchsia-50 text-fuchsia-700",
  "buying-group": "bg-teal-50 text-teal-700",
  other: "bg-neutral-100 text-neutral-500",
};

function Section({ eyebrow, title, right, children }: { eyebrow?: string; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-neutral-200 pt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-800">{eyebrow}</div>}
          <h2 className="mt-1 text-xl font-semibold text-neutral-900">{title}</h2>
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "red" | "amber" | "emerald" }) {
  const toneCls =
    tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : "text-neutral-900";
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

function Flag({ flag }: { flag: CrmFlag }) {
  const cls =
    flag.level === "red"
      ? "border-red-200 bg-red-50 text-red-800"
      : flag.level === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-neutral-200 bg-neutral-50 text-neutral-700";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        {flag.account && <span className="font-semibold">{flag.account}</span>}
        <span>{flag.text}</span>
      </div>
      {flag.source && <div className="mt-1 text-[11px] opacity-70">{flag.source}</div>}
    </div>
  );
}

function ReviewRow({ r }: { r: CrmReview }) {
  const d = r.daysToCutoff;
  const urgent = typeof d === "number" && d >= 0 && d <= 30;
  const closed = typeof d === "number" && d < 0;
  return (
    <tr className={closed ? "opacity-45" : ""}>
      <td className="border-t border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-800">{r.retailer}</td>
      <td className="border-t border-neutral-100 px-3 py-2 text-sm text-neutral-600">{r.category}</td>
      <td className="whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-sm tabular-nums text-neutral-800">{fmtDate(r.cutoff)}</td>
      <td className="whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-right text-sm tabular-nums">
        {typeof d !== "number" ? (
          <span className="text-neutral-400">—</span>
        ) : d < 0 ? (
          <span className="text-neutral-400">closed {Math.abs(d)}d ago</span>
        ) : (
          <span className={urgent ? "font-semibold text-red-600" : "text-neutral-700"}>{d}d left</span>
        )}
      </td>
      <td className="border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500">{r.owner || r.source}</td>
    </tr>
  );
}

function AccountRow({ a }: { a: CrmAccount }) {
  const [open, setOpen] = useState(false);
  const doors = a.plannedDoors ?? a.doors;
  return (
    <>
      <tr className="cursor-pointer hover:bg-neutral-50" onClick={() => setOpen((v) => !v)}>
        <td className="border-t border-neutral-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-neutral-300">{open ? "▾" : "▸"}</span>
            <span className="text-sm font-medium text-neutral-900">{a.company}</span>
            {a.due && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">DUE</span>}
          </div>
          {a.dueReason && <div className="ml-6 mt-0.5 text-xs text-red-600">{a.dueReason}</div>}
        </td>
        <td className="border-t border-neutral-100 px-3 py-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_CHIP[a.type] || TYPE_CHIP.other}`}>{a.type}</span>
        </td>
        <td className="border-t border-neutral-100 px-3 py-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${STAGE_CHIP[a.stage]}`}>{a.stage}</span>
        </td>
        <td className="whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-right text-sm tabular-nums text-neutral-800">
          {doors ?? "—"}
          {a.inPlan && a.plannedOpen && <div className="text-[11px] text-neutral-400">plan {fmtDate(a.plannedOpen)}</div>}
        </td>
        <td className="whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-sm tabular-nums text-neutral-700">
          {fmtDate(a.lastTouch)}
          {a.daysSince !== null && <span className="ml-1 text-[11px] text-neutral-400">{a.daysSince}d</span>}
        </td>
        <td className="whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-sm">
          {a.owes === "us" ? (
            <span className="font-semibold text-red-600">us</span>
          ) : a.owes === "them" ? (
            <span className="text-neutral-500">them</span>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </td>
        <td className="whitespace-nowrap border-t border-neutral-100 px-3 py-2 text-sm tabular-nums text-neutral-700">
          {a.nextMeeting ? <span className="font-medium text-cyan-700">{fmtDate(a.nextMeeting)}</span> : <span className="text-neutral-300">—</span>}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="border-t border-neutral-100 bg-neutral-50/70 px-3 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Contacts</div>
                {a.contacts.length === 0 && <div className="mt-1 text-sm text-neutral-400">No contact on file.</div>}
                <ul className="mt-1 space-y-1.5">
                  {a.contacts.map((c, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-neutral-800">{c.name}</span>
                      {c.role && <span className="text-neutral-500"> — {c.role}</span>}
                      {c.emails.map((e) => (
                        <div key={e} className="font-mono text-xs text-cyan-700">{e}</div>
                      ))}
                    </li>
                  ))}
                </ul>
                {a.thirdParty.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Retailers they named</div>
                    <div className="mt-1 text-sm text-neutral-700">{a.thirdParty.join("; ")}</div>
                  </div>
                )}
                {a.reviewWindows.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Review / timing</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-neutral-700">
                      {a.reviewWindows.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">History</div>
                <ul className="mt-1 space-y-2">
                  {a.statuses.map((s, i) => (
                    <li key={i} className="text-sm text-neutral-700">
                      <span className="mr-1 font-mono text-xs text-neutral-400">{s.date || "—"}</span>
                      <span className="mr-1 rounded bg-neutral-200 px-1 text-[10px] uppercase text-neutral-600">{s.src.replace("_crm", "")}</span>
                      {s.text}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.threads.slice(0, 5).map((t) => (
                    <a
                      key={t}
                      href={`https://mail.google.com/mail/u/0/#all/${t}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[11px] text-cyan-700 hover:bg-cyan-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      open thread
                    </a>
                  ))}
                </div>
                {a.aliases.length > 1 && (
                  <div className="mt-3 text-[11px] text-neutral-400">Merged from: {a.aliases.join(" · ")}</div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type Filter = "due" | "all" | "retailer" | "distributor" | "broker" | "plan" | "target";

export default function CrmView({ snapshot, storeError }: Props) {
  const [filter, setFilter] = useState<Filter>("due");
  const [q, setQ] = useState("");

  const accounts = useMemo(() => {
    if (!snapshot) return [];
    let list = snapshot.accounts;
    if (filter === "due") list = list.filter((a) => a.due);
    else if (filter === "plan") list = list.filter((a) => a.inPlan);
    else if (filter === "target") list = list.filter((a) => a.stage === "target");
    else if (filter !== "all") list = list.filter((a) => a.type === filter);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (a) =>
          a.company.toLowerCase().includes(needle) ||
          a.contacts.some((c) => c.name.toLowerCase().includes(needle) || c.emails.some((e) => e.toLowerCase().includes(needle))),
      );
    }
    return [...list].sort((a, b) => {
      if (a.due !== b.due) return a.due ? -1 : 1;
      return (b.plannedDoors ?? b.doors ?? 0) - (a.plannedDoors ?? a.doors ?? 0);
    });
  }, [snapshot, filter, q]);

  if (storeError) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Storage error: {storeError}</div>
      </Shell>
    );
  }
  if (!snapshot) {
    return (
      <Shell>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          No CRM snapshot yet. Run <code className="rounded bg-neutral-100 px-1">node emit-crm-snapshot.js</code> from cotto-pipeline to populate it.
        </div>
      </Shell>
    );
  }

  const reds = snapshot.flags.filter((f) => f.level === "red");
  const ambers = snapshot.flags.filter((f) => f.level === "amber");
  const dueCount = snapshot.accounts.filter((a) => a.due).length;
  const openReviews = snapshot.reviews.filter((r) => typeof r.daysToCutoff === "number" && r.daysToCutoff >= 0);
  const nextReview = openReviews[0];

  const TABS: Array<[Filter, string, number]> = [
    ["due", "Due now", dueCount],
    ["all", "All", snapshot.accounts.length],
    ["retailer", "Retailers", snapshot.accounts.filter((a) => a.type === "retailer").length],
    ["distributor", "Distributors", snapshot.accounts.filter((a) => a.type === "distributor").length],
    ["broker", "Brokers", snapshot.accounts.filter((a) => a.type === "broker").length],
    ["plan", "In door plan", snapshot.accounts.filter((a) => a.inPlan).length],
    ["target", "Never contacted", snapshot.accounts.filter((a) => a.stage === "target").length],
  ];

  return (
    <Shell updatedAt={snapshot.updatedAt} asOf={snapshot.asOf}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Doors live" value={String(snapshot.doors.liveNow)} sub={`plan says ${snapshot.doors.plannedNow} by now`} tone={snapshot.doors.liveNow < snapshot.doors.plannedNow ? "amber" : "emerald"} />
        <Stat label="Need action" value={String(dueCount)} sub={`of ${snapshot.accounts.length} accounts`} tone={dueCount > 0 ? "red" : undefined} />
        <Stat label="Accounts tracked" value={String(snapshot.accounts.length)} sub={snapshot.coverage ? `from ${snapshot.coverage.records} records` : undefined} />
        <Stat
          label="Next review cutoff"
          value={nextReview ? `${nextReview.daysToCutoff}d` : "—"}
          sub={nextReview ? `${nextReview.retailer} · ${nextReview.category}` : undefined}
          tone={nextReview && (nextReview.daysToCutoff ?? 99) <= 30 ? "red" : undefined}
        />
      </div>

      {(reds.length > 0 || ambers.length > 0) && (
        <Section eyebrow="Reminders" title="Needs you now">
          <div className="space-y-2">
            {reds.map((f, i) => <Flag key={`r${i}`} flag={f} />)}
            {ambers.map((f, i) => <Flag key={`a${i}`} flag={f} />)}
          </div>
        </Section>
      )}

      <Section
        eyebrow="Pipeline"
        title="Accounts"
        right={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, person, email…"
            className="w-56 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-cyan-500"
          />
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TABS.map(([k, label, n]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === k ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {label} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                {["Account", "Type", "Stage", "Doors", "Last touch", "Owes", "Next"].map((h, i) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap bg-neutral-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500 ${i === 3 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => <AccountRow key={a.id} a={a} />)}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-neutral-400">Nothing here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Calendar" title="Category reviews & submission windows">
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr>
                {["Retailer", "Category", "Cutoff", "", "Owner / source"].map((h, i) => (
                  <th
                    key={i}
                    className={`whitespace-nowrap bg-neutral-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500 ${i === 3 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.reviews.map((r, i) => <ReviewRow key={i} r={r} />)}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Model" title="Door plan vs reality">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-600">
            The financial model plans <span className="font-semibold text-neutral-900">{snapshot.doors.plannedNow}</span> doors open by{" "}
            {fmtDate(snapshot.asOf)}. Live today: <span className="font-semibold text-neutral-900">{snapshot.doors.liveNow}</span>.
          </div>
          <div className="mt-4 space-y-1.5">
            {snapshot.doors.byPeriod.map((p) => {
              const max = Math.max(...snapshot.doors.byPeriod.map((x) => x.cumulative), 1);
              return (
                <div key={p.period} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-xs tabular-nums text-neutral-500">{p.period}</div>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-neutral-100">
                    <div className="h-full rounded bg-cyan-600/80" style={{ width: `${(p.cumulative / max) * 100}%` }} />
                  </div>
                  <div className="w-24 shrink-0 text-right text-xs tabular-nums text-neutral-600">
                    {p.cumulative} <span className="text-neutral-400">(+{p.planned})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {snapshot.coverage?.note && (
        <p className="mt-8 border-t border-neutral-200 pt-4 text-xs leading-relaxed text-neutral-400">{snapshot.coverage.note}</p>
      )}
    </Shell>
  );
}

function Shell({ children, updatedAt, asOf }: { children: ReactNode; updatedAt?: string; asOf?: string }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-800">Cotto</div>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Retail CRM</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          {asOf && <span>as of {fmtDate(asOf)}</span>}
          {updatedAt && <span>updated {timeAgo(updatedAt)}</span>}
          <Link href="/dash" className="text-cyan-700 hover:underline">dash</Link>
          <Link href="/dash/ops" className="text-cyan-700 hover:underline">ops</Link>
        </div>
      </div>
      {children}
    </main>
  );
}
