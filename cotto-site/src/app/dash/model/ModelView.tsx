"use client";

import Link from "next/link";
import { useState } from "react";
import type { ModelSnapshot, SkuInventory } from "@/lib/dash/model-store";

type Props = {
  snapshot: ModelSnapshot | null;
  storeError: string | null;
};

const SKU_LABEL: Record<string, string> = { BUF: "Buffalo", FO: "French Onion", GR: "Garden Ranch" };

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

function wosColor(w: number | null): string {
  if (w === null) return "text-neutral-400";
  if (w < 1) return "text-red-600";
  if (w < 2) return "text-amber-600";
  return "text-emerald-700";
}

function SkuCard({ inv }: { inv: SkuInventory }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-neutral-900">{SKU_LABEL[inv.sku] ?? inv.sku}</h3>
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">{inv.sku}</span>
      </div>
      <div className="mt-3 flex items-end gap-4">
        <div>
          <div className="text-3xl font-bold leading-none text-neutral-900">{inv.sellable.toLocaleString()}</div>
          <div className="mt-1 text-xs text-neutral-500">cases sellable</div>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-lg font-semibold leading-none ${wosColor(inv.weeksOfSupply)}`}>
            {inv.weeksOfSupply === null ? "—" : `${inv.weeksOfSupply.toFixed(1)}w`}
          </div>
          <div className="mt-1 text-xs text-neutral-500">of supply</div>
        </div>
      </div>
      {inv.held > 0 && (
        <div className="mt-2 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          {inv.held.toLocaleString()} cs on hold (not sellable)
        </div>
      )}
      {inv.lots && inv.lots.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-neutral-100 pt-2">
          {inv.lots.map((lot, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-neutral-600">
                {lot.lot}
                {lot.bbd ? <span className="text-neutral-400"> · BBD {lot.bbd}</span> : null}
                {lot.status ? <span className="ml-1 text-amber-600">({lot.status})</span> : null}
              </span>
              <span className="font-medium text-neutral-800">{lot.cases.toLocaleString()} cs</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModelView({ snapshot, storeError }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-neutral-50 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">S&amp;OP Model</h1>
          <p className="text-xs text-neutral-500">
            {snapshot?.asOf ? `as of ${snapshot.asOf} · ` : ""}
            {snapshot?.updatedAt ? `updated ${timeAgo(snapshot.updatedAt)}` : "no data yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              window.location.reload();
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            {refreshing ? "…" : "Refresh"}
          </button>
          <Link
            href="/dash"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            To-dos →
          </Link>
        </div>
      </div>

      {storeError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Storage error: {storeError}
        </div>
      )}

      {!snapshot && !storeError && (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          No model snapshot yet. Run the pipeline publisher
          <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 text-xs">node cotto-pipeline/emit-snapshot.js</code>
          to push the latest model here.
        </div>
      )}

      {snapshot && (
        <>
          {snapshot.flags && snapshot.flags.length > 0 && (
            <div className="mt-4 space-y-2">
              {snapshot.flags.map((f, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 text-sm ${
                    f.level === "red"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : f.level === "amber"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  {f.level === "red" ? "🔴 " : f.level === "amber" ? "🟠 " : "• "}
                  {f.text}
                </div>
              ))}
            </div>
          )}

          <section className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Inventory</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {snapshot.inventory.map((inv) => (
                <SkuCard key={inv.sku} inv={inv} />
              ))}
            </div>
          </section>

          {snapshot.cash && (
            <section className="mt-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Cash</h2>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-2xl font-bold text-neutral-900">
                    {snapshot.cash.runwayWeeks === null ? "—" : `${snapshot.cash.runwayWeeks.toFixed(0)}w`}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">runway</div>
                </div>
                <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="text-2xl font-bold text-neutral-900">
                    {snapshot.cash.minBalance === null ? "—" : `$${Math.round(snapshot.cash.minBalance).toLocaleString()}`}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">min 6-wk balance</div>
                </div>
              </div>
              {snapshot.cash.note && <p className="mt-2 text-xs text-neutral-500">{snapshot.cash.note}</p>}
            </section>
          )}

          {snapshot.deliveries && snapshot.deliveries.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Recent &amp; upcoming deliveries
              </h2>
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {snapshot.deliveries.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-neutral-100 px-4 py-2 text-sm last:border-0"
                  >
                    <span className="text-neutral-800">{d.account}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-medium text-neutral-900">{d.cases} cs</span>
                      <span className="text-xs text-neutral-400">{d.date}</span>
                      {d.status ? <span className="text-xs text-neutral-500">{d.status}</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {snapshot.notes && snapshot.notes.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</h2>
              <ul className="space-y-1">
                {snapshot.notes.map((n, i) => (
                  <li key={i} className="text-sm text-neutral-600">
                    • {n}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="mt-8 text-center text-xs text-neutral-400">
        Cotto OS · read-only model snapshot · pushed from the spine
      </p>
    </main>
  );
}
