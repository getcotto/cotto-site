"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  FocusSnapshot,
  FocusItem,
  FocusBucketItem,
  FocusDecisionItem,
  FocusDraftable,
  FocusDraftState,
} from "@/lib/dash/focus-store";
import type { FocusRequest, FocusRequestType } from "@/lib/dash/focus-requests";

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

// ————————————————————————————————————————————————————————————————
// Request bridge. The page can't do the work (Gmail + voice files live on Kendall's
// machine); it drops a request on the queue and a local worker picks it up. This
// context centralizes: enqueue a request, poll its status, and refetch the snapshot
// when the worker reports done so the new draft shows up.
// ————————————————————————————————————————————————————————————————
type RequestCtx = {
  submit: (input: { type: FocusRequestType; itemId?: string; feedback?: string }) => Promise<FocusRequest | null>;
  refetch: () => Promise<void>;
};
const FocusRequestContext = createContext<RequestCtx | null>(null);

async function pollUntilDone(
  id: string,
  onSettle: (status: "done" | "error", message?: string) => void
): Promise<void> {
  const started = Date.now();
  const tick = async (): Promise<void> => {
    // Give up after ~5 min so a dead worker doesn't leave the spinner forever.
    if (Date.now() - started > 5 * 60_000) {
      onSettle("error", "no response from local worker (timed out)");
      return;
    }
    try {
      const res = await fetch(`/api/dash/focus/request?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const { status } = (await res.json()) as {
          status: { status: string; message?: string } | null;
        };
        if (status?.status === "done") return onSettle("done", status.message);
        if (status?.status === "error") return onSettle("error", status.message);
      }
    } catch {
      // transient — keep polling
    }
    setTimeout(tick, 2500);
  };
  setTimeout(tick, 2500);
}

// ————————————————————————————————————————————————————————————————

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

// A small legible chip for the live draft lifecycle inside an open workbench.
function StateBadge({ state }: { state: FocusDraftState }) {
  const map: Record<FocusDraftState, { text: string; cls: string }> = {
    none: { text: "no draft yet", cls: "border-neutral-200 bg-neutral-50 text-neutral-500" },
    generating: { text: "generating…", cls: "border-cyan-200 bg-cyan-50 text-cyan-800 animate-pulse" },
    ready: { text: "draft ready · not sent", cls: "border-amber-300 bg-amber-50 text-amber-800" },
    pushed: { text: "pushed to Gmail ✓ · still a draft", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  };
  const m = map[state] ?? map.none;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      {m.text}
    </span>
  );
}

// ————————————————————————————————————————————————————————————————
// The interactive workbench: a collapsed "show more" disclosure that reveals the
// summary of THEIR email, the proposed reply, a feedback box + Regenerate, and a
// Push to Gmail button. Only rendered for items the agent tagged with an id.
// ————————————————————————————————————————————————————————————————
function DraftWorkbench({ item }: { item: FocusDraftable }) {
  const ctx = useContext(FocusRequestContext);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  // Local override of the snapshot's draftState while a request is in flight, plus a
  // transient note. Once the worker finishes we refetch and the snapshot takes over.
  const [localState, setLocalState] = useState<FocusDraftState | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "regenerate" | "push">(null);

  const snapState: FocusDraftState = item.draftState ?? (item.draftText ? "ready" : "none");
  const state = localState ?? snapState;
  const hasDraft = !!item.draftText;

  const run = useCallback(
    async (type: FocusRequestType, working: FocusDraftState, busyKind: "regenerate" | "push", fb?: string) => {
      if (!ctx || !item.id) return;
      setBusy(busyKind);
      setLocalState(working);
      setNote(null);
      const req = await ctx.submit({ type, itemId: item.id, feedback: fb });
      if (!req) {
        setBusy(null);
        setLocalState(null);
        setNote("Could not queue the request — try again.");
        return;
      }
      await pollUntilDone(req.id, async (settle, message) => {
        if (settle === "done") {
          setNote(message ?? "Done — updated.");
          await ctx.refetch();
          // Refetch replaces the snapshot; drop the local override so the fresh
          // draftState from the worker wins.
          setLocalState(null);
          if (busyKind === "regenerate") setFeedback("");
        } else {
          setNote(message ?? "The local worker hit an error.");
          setLocalState(null);
        }
        setBusy(null);
      });
    },
    [ctx, item.id]
  );

  if (!item.id) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-800 hover:text-cyan-900"
      >
        <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        {open ? "hide draft" : hasDraft ? "show draft" : "show more"}
        {!open && <StateBadgeInline state={state} />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 sm:p-4">
          {/* Their email, in plain English. */}
          {item.summary && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Their email</div>
              <p className="mt-1 text-sm leading-snug text-neutral-700">{item.summary}</p>
            </div>
          )}

          {/* The proposed reply — labelled unmistakably as not sent. */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Draft reply · not sent
              </div>
              <StateBadge state={state} />
            </div>
            {hasDraft ? (
              <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-lg border border-amber-200 bg-white p-3 font-sans text-sm leading-relaxed text-neutral-800">
                {item.draftText}
              </pre>
            ) : (
              <div className="mt-1.5 rounded-lg border border-dashed border-neutral-300 bg-white p-3 text-sm text-neutral-400">
                {state === "generating"
                  ? "Drafting a reply…"
                  : "No draft written yet. Add a steer below and hit Regenerate to have your agent draft one."}
              </div>
            )}
          </div>

          {/* Feedback → Regenerate. */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Tell me how to change this draft
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="e.g. warmer open, drop the pricing paragraph, confirm the Thursday delivery…"
              className="mt-1.5 w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm outline-none placeholder:text-neutral-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* Actions. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={busy != null}
              onClick={() => run("regenerate", "generating", "regenerate", feedback.trim() || undefined)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "regenerate" ? "Regenerating…" : hasDraft ? "Regenerate" : "Draft it"}
            </button>
            <button
              type="button"
              disabled={busy != null || !hasDraft || state === "pushed"}
              onClick={() => run("push_to_gmail", "generating", "push")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "push" ? "Pushing…" : state === "pushed" ? "Pushed to Gmail ✓" : "Push to Gmail"}
            </button>
            {note && <span className="text-xs text-neutral-500">{note}</span>}
          </div>

          <p className="text-[11px] leading-snug text-neutral-400">
            Buttons queue the work for your local agent — it re-drafts, records your steer as a voice lesson, and creates
            the Gmail draft. Nothing is ever sent. This panel updates when your agent finishes.
          </p>
        </div>
      )}
    </div>
  );
}

// A tiny inline echo of the state next to the collapsed toggle, so the lifecycle is
// visible without expanding.
function StateBadgeInline({ state }: { state: FocusDraftState }) {
  if (state === "none") return null;
  const map: Record<Exclude<FocusDraftState, "none">, string> = {
    generating: "text-cyan-700",
    ready: "text-amber-700",
    pushed: "text-emerald-700",
  };
  const text = state === "generating" ? "generating…" : state === "ready" ? "draft ready" : "pushed ✓";
  return <span className={`ml-1 normal-case tracking-normal ${map[state as Exclude<FocusDraftState, "none">]}`}>· {text}</span>;
}

export default function FocusView({ snapshot, storeError }: Props) {
  const [snap, setSnap] = useState<FocusSnapshot | null>(snapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);
  const pollingRef = useRef(false);

  // Pull the latest snapshot from the API (cookie-authed). Used after a worker
  // reports done, and by the top-of-page Refresh button.
  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/dash/focus", { cache: "no-store" });
      if (!res.ok) return;
      const { snapshot: fresh } = (await res.json()) as { snapshot: FocusSnapshot | null };
      if (fresh) setSnap(fresh);
    } catch {
      // leave the current snapshot in place
    }
  }, []);

  const submit = useCallback(
    async (input: { type: FocusRequestType; itemId?: string; feedback?: string }) => {
      try {
        const res = await fetch("/api/dash/focus/request", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) return null;
        const { request } = (await res.json()) as { request: FocusRequest };
        return request;
      } catch {
        return null;
      }
    },
    []
  );

  // Refresh: re-run the inbox triage on Kendall's machine. Enqueues a refresh request
  // and, when the worker republishes the snapshot, re-pulls it.
  const onRefresh = useCallback(async () => {
    if (pollingRef.current) return;
    setRefreshing(true);
    setRefreshNote("queued — your agent is re-triaging the inbox");
    pollingRef.current = true;
    const req = await submit({ type: "refresh" });
    if (!req) {
      setRefreshing(false);
      setRefreshNote("Could not queue the refresh — try again.");
      pollingRef.current = false;
      return;
    }
    await pollUntilDone(req.id, async (settle, message) => {
      if (settle === "done") {
        setRefreshNote("Inbox re-triaged.");
        await refetch();
      } else {
        setRefreshNote(message ?? "The local worker hit an error.");
      }
      setRefreshing(false);
      pollingRef.current = false;
    });
  }, [submit, refetch]);

  const ctx: RequestCtx = { submit, refetch };

  if (storeError) {
    return (
      <Shell onRefresh={onRefresh} refreshing={refreshing} refreshNote={refreshNote}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Storage error: {storeError}
        </div>
      </Shell>
    );
  }
  if (!snap) {
    return (
      <Shell onRefresh={onRefresh} refreshing={refreshing} refreshNote={refreshNote}>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          No focus digest yet. The inbox sweep publishes one to{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5">POST /api/dash/focus</code> with the dash Bearer token.
        </div>
      </Shell>
    );
  }

  const s = snap;
  const nothingNeedsYou =
    s.focus.length === 0 &&
    s.buckets.respondNow.length === 0 &&
    s.buckets.canWait.length === 0 &&
    s.buckets.needsDecision.length === 0 &&
    s.buckets.fyi.length === 0;

  return (
    <FocusRequestContext.Provider value={ctx}>
      <Shell updatedAt={s.updatedAt} onRefresh={onRefresh} refreshing={refreshing} refreshNote={refreshNote}>
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
                      key={f.id ?? f.rank}
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
                        <DraftWorkbench item={f} />
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* OWES ROLLUP — the short "you owe the move" line. */}
            {s.owesRollup.length > 0 && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <span className="font-semibold">You owe the move on:</span> {s.owesRollup.join(" · ")}
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
    </FocusRequestContext.Provider>
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
// collapsed so the page opens on what's urgent). Each row shows you-vs-them, any
// staged draft, and — when the agent tagged it with an id — the interactive draft
// workbench.
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
            <li key={it.id ?? i} className="px-4 py-2.5">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
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
              </div>
              <DraftWorkbench item={it} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Shell({
  children,
  updatedAt,
  onRefresh,
  refreshing,
  refreshNote,
}: {
  children: ReactNode;
  updatedAt?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshNote?: string | null;
}) {
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
          <div className="flex items-center gap-3">
            {updatedAt ? (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400">
                refreshed {timeAgo(updatedAt)}
              </span>
            ) : null}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-800 shadow-sm transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={refreshing ? "inline-block animate-spin" : "inline-block"}>↻</span>
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            )}
          </div>
        </div>
        {refreshNote && <div className="mt-2 text-xs text-neutral-500">{refreshNote}</div>}
        {children}
        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Cotto — Dipsy LLC · internal. Drafts are staged, never sent — every send is Kendall&apos;s. Published by the inbox triage sweep.
        </footer>
      </main>
    </div>
  );
}
