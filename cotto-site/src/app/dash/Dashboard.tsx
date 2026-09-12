"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, type Category, type TodoItem } from "@/lib/dash/types";

type Props = {
  initialItems: TodoItem[];
  storeError: string | null;
};

const STORAGE_LAST_CATEGORY = "dash:lastCategory";

/** Monday of the current week, as M/D — the heading Kendall writes by hand ("w/o 9/14"). */
function mondayOf(d = new Date()): string {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return `${m.getMonth() + 1}/${m.getDate()}`;
}

export default function Dashboard({ initialItems, storeError }: Props) {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("ops");
  const [priority, setPriority] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  const [error, setError] = useState<string | null>(storeError);
  const [harvest, setHarvest] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const weekOf = useMemo(() => mondayOf(), []);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_LAST_CATEGORY)) as
      | Category
      | null;
    if (saved && CATEGORIES.includes(saved)) setCategory(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_LAST_CATEGORY, category);
  }, [category]);

  // System plumbing (reconcile hints, fix:X3 flags) is real but it is NOT her to-do
  // list. Her words: those flags "have been clouding the dash." It gets its own
  // collapsed section at the bottom and never mixes into the business sections.
  const { open, done, system } = useMemo(() => {
    const open: TodoItem[] = [];
    const done: TodoItem[] = [];
    const system: TodoItem[] = [];
    for (const it of items) {
      if (it.kind === "system") {
        if (!it.done) system.push(it);
        continue;
      }
      (it.done ? done : open).push(it);
    }
    return { open, done, system };
  }, [items]);

  // Built from CATEGORIES rather than a hand-written object literal, so adding a
  // section to types.ts cannot silently drop its items on the floor here.
  const grouped = useMemo(() => {
    const m = Object.fromEntries(CATEGORIES.map((c) => [c, [] as TodoItem[]])) as Record<Category, TodoItem[]>;
    const kids = new Map<string, TodoItem[]>();
    const roots: TodoItem[] = [];
    for (const it of open) {
      if (it.parentId) {
        const arr = kids.get(it.parentId) ?? [];
        arr.push(it);
        kids.set(it.parentId, arr);
      } else {
        roots.push(it);
      }
    }
    // A child whose parent is gone or already done would otherwise vanish. Promote it.
    const rootIds = new Set(roots.map((r) => r.id));
    for (const [pid, arr] of kids) if (!rootIds.has(pid)) roots.push(...arr);
    for (const it of roots) m[it.category].push(it);
    for (const k of CATEGORIES) {
      m[k].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
    }
    return { byCat: m, kids, rootIds };
  }, [open]);

  async function addItem(childOf?: string, childText?: string) {
    const t = (childText ?? text).trim();
    if (!t) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: TodoItem = {
      id: tempId,
      text: t,
      category: childOf ? (items.find((i) => i.id === childOf)?.category ?? category) : category,
      parentId: childOf,
      kind: "task",
      priority: childOf ? false : priority,
      done: false,
      createdAt: new Date().toISOString(),
      source: "kendall",
    };
    setItems((prev) => [optimistic, ...prev]);
    if (!childOf) {
      setText("");
      setPriority(false);
      inputRef.current?.focus();
    }
    try {
      const res = await fetch("/api/dash/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: t,
          category: optimistic.category,
          priority: optimistic.priority,
          parentId: childOf,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { item } = (await res.json()) as { item: TodoItem };
      setItems((prev) => prev.map((it) => (it.id === tempId ? item : it)));
    } catch (e) {
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      setError(e instanceof Error ? e.message : "Failed to add");
    }
  }

  async function patch(id: string, patch: Partial<TodoItem>) {
    const before = items;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      const res = await fetch(`/api/dash/todos/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { item } = (await res.json()) as { item: TodoItem };
      setItems((prev) => prev.map((it) => (it.id === id ? item : it)));
    } catch (e) {
      setItems(before);
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function remove(id: string) {
    const before = items;
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      const res = await fetch(`/api/dash/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
    } catch (e) {
      setItems(before);
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function logout() {
    await fetch("/api/dash/auth", { method: "DELETE" });
    window.location.href = "/dash";
  }

  // "capture call" — raise the pending flag; the in-app meeting-harvest listener runs
  // the real Zoom capture within a few minutes and posts the to-dos here. The button
  // only requests; it never blocks on the capture itself.
  async function captureCall() {
    if (harvest === "sending") return;
    setHarvest("sending");
    try {
      const res = await fetch("/api/dash/harvest", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setHarvest("sent");
      setTimeout(() => setHarvest("idle"), 20_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request capture");
      setHarvest("error");
      setTimeout(() => setHarvest("idle"), 5_000);
    }
  }

  return (
    <div className="container py-6 max-w-2xl">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:underline">
            dismiss
          </button>
        </div>
      )}

      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl text-cotto-red">dash</h1>
          <div className="text-xs text-cotto-red/50 mt-0.5">w/o {weekOf}</div>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs">
          <a href="/dash/ops" className="text-cotto-red/60 hover:text-cotto-red">ops</a>
          <a href="/dash/week" className="text-cotto-red/60 hover:text-cotto-red">week</a>
          <a href="/dash/crm" className="text-cotto-red/60 hover:text-cotto-red">crm</a>
          <a href="/dash/model" className="text-cotto-red/60 hover:text-cotto-red">model</a>
          <button
            onClick={captureCall}
            disabled={harvest === "sending"}
            title="Flags your most recent Zoom call for capture. The harvest runs at 1:30pm and 9:30pm and picks it up then."
            className="font-medium text-cotto-red hover:underline disabled:opacity-40"
          >
            {harvest === "sending"
              ? "requesting…"
              : harvest === "sent"
                ? "queued ✓"
                : harvest === "error"
                  ? "try again"
                  : "＋ capture call"}
          </button>
          <a href="/dash/focus" className="font-medium text-cotto-red hover:underline">
            focus →
          </a>
          <button onClick={logout} className="text-cotto-red/60 hover:text-cotto-red">
            log out
          </button>
        </nav>
      </div>

      <div className="sticky top-0 z-10 bg-brand-cream pt-1 pb-3">
        <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPriority((p) => !p)}
              aria-label="toggle priority"
              className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                priority ? "bg-cotto-red text-white" : "text-cotto-red/40 hover:text-cotto-red"
              }`}
            >
              {priority ? "★" : "☆"}
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
              }}
              placeholder="What needs to get done?"
              className="flex-1 bg-transparent text-cotto-red placeholder-cotto-red/40 focus:outline-none py-2"
            />
            <button
              onClick={() => addItem()}
              disabled={!text.trim()}
              className="shrink-0 px-3 h-9 rounded-lg bg-cotto-red text-white text-sm font-medium disabled:opacity-30"
            >
              add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  category === c
                    ? "bg-cotto-red text-white border-cotto-red"
                    : "bg-white text-cotto-red/70 border-black/10 hover:border-cotto-red/40"
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {CATEGORIES.map((c) => {
          const list = grouped.byCat[c];
          if (list.length === 0) return null;
          return (
            <section key={c}>
              <div className="text-xs uppercase tracking-wider text-cotto-red/50 mb-1.5 px-1">
                {CATEGORY_LABEL[c]} <span className="text-cotto-red/30">· {list.length}</span>
              </div>
              <ul className="rounded-2xl border border-black/10 bg-white divide-y divide-black/5 overflow-hidden">
                {list.map((it) => (
                  <Item
                    key={it.id}
                    item={it}
                    subItems={grouped.kids.get(it.id) ?? []}
                    onPatch={patch}
                    onDelete={remove}
                    onAddChild={(txt) => addItem(it.id, txt)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {open.length === 0 && (
          <div className="text-center text-cotto-red/50 py-12 text-sm">
            Nothing on the list. Type something up top.
          </div>
        )}
      </div>

      {system.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowSystem((v) => !v)}
            className="text-xs uppercase tracking-wider text-cotto-red/40 hover:text-cotto-red px-1"
          >
            System · {system.length} {showSystem ? "▾" : "▸"}
          </button>
          {showSystem && (
            <ul className="mt-2 rounded-2xl border border-black/10 bg-white/50 divide-y divide-black/5 overflow-hidden">
              {system.map((it) => (
                <Item key={it.id} item={it} subItems={[]} onPatch={patch} onDelete={remove} />
              ))}
            </ul>
          )}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowDone((s) => !s)}
            className="text-xs uppercase tracking-wider text-cotto-red/50 hover:text-cotto-red px-1"
          >
            Done today · {done.length} {showDone ? "▾" : "▸"}
          </button>
          {showDone && (
            <ul className="mt-2 rounded-2xl border border-black/10 bg-white/50 divide-y divide-black/5 overflow-hidden">
              {done.map((it) => (
                <Item key={it.id} item={it} subItems={[]} onPatch={patch} onDelete={remove} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Item({
  item,
  subItems,
  onPatch,
  onDelete,
  onAddChild,
}: {
  item: TodoItem;
  subItems: TodoItem[];
  onPatch: (id: string, p: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
  onAddChild?: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [showWhy, setShowWhy] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childDraft, setChildDraft] = useState("");

  function commitChild() {
    const v = childDraft.trim();
    setChildDraft("");
    setAddingChild(false);
    if (v && onAddChild) onAddChild(v);
  }

  function commit() {
    const v = draft.trim();
    setEditing(false);
    if (!v) {
      setDraft(item.text);
      return;
    }
    if (v !== item.text) onPatch(item.id, { text: v });
  }

  return (
    <li className="group flex items-start gap-2 px-3 py-2.5">
      <button
        onClick={() => onPatch(item.id, { done: !item.done })}
        aria-label={item.done ? "mark not done" : "mark done"}
        className={`mt-0.5 shrink-0 w-5 h-5 rounded border ${
          item.done ? "bg-cotto-red border-cotto-red text-white" : "border-cotto-red/40 hover:border-cotto-red"
        } flex items-center justify-center text-xs`}
      >
        {item.done ? "✓" : ""}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(item.text);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-cotto-red focus:outline-none border-b border-cotto-red/30"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`text-left w-full break-words text-cotto-red ${
              item.done ? "line-through opacity-50" : ""
            } ${item.priority && !item.done ? "font-semibold" : ""}`}
          >
            {item.priority && !item.done && <span className="mr-1">★</span>}
            {item.text}
            {item.source === "claude" && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-cotto-blue/70">claude</span>
            )}
            {item.source === "digest" && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-cotto-blue/70">digest</span>
            )}
          </button>
        )}

        {/* The reasoning the harvesters attach. Present, but never competing with the task. */}
        {item.why && !item.done && (
          <button
            onClick={() => setShowWhy((v) => !v)}
            className="mt-0.5 text-left text-xs text-cotto-red/45 hover:text-cotto-red/80"
          >
            {showWhy ? item.why : "why ▸"}
          </button>
        )}

        {subItems.length > 0 && (
          <ul className="mt-1.5 ml-1 border-l border-black/10 pl-3 space-y-1">
            {subItems.map((ch) => (
              <li key={ch.id} className="group/ch flex items-start gap-2">
                <button
                  onClick={() => onPatch(ch.id, { done: !ch.done })}
                  aria-label={ch.done ? "mark not done" : "mark done"}
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded border ${
                    ch.done ? "bg-cotto-red border-cotto-red text-white" : "border-cotto-red/40 hover:border-cotto-red"
                  } flex items-center justify-center text-[10px]`}
                >
                  {ch.done ? "✓" : ""}
                </button>
                <span className={`flex-1 text-sm text-cotto-red ${ch.done ? "line-through opacity-50" : ""}`}>
                  {ch.text}
                </span>
                <button
                  onClick={() => onDelete(ch.id)}
                  aria-label="delete"
                  className="shrink-0 text-cotto-red/20 opacity-0 group-hover/ch:opacity-100 hover:text-cotto-red"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {addingChild && (
          <input
            autoFocus
            value={childDraft}
            onChange={(e) => setChildDraft(e.target.value)}
            onBlur={commitChild}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitChild();
              if (e.key === "Escape") {
                setChildDraft("");
                setAddingChild(false);
              }
            }}
            placeholder="sub-item"
            className="mt-1.5 ml-4 w-[calc(100%-1rem)] bg-transparent text-sm text-cotto-red placeholder-cotto-red/30 focus:outline-none border-b border-cotto-red/20"
          />
        )}
      </div>

      {!item.done && onAddChild && !addingChild && (
        <button
          onClick={() => setAddingChild(true)}
          aria-label="add sub-item"
          title="add a sub-item"
          className="shrink-0 mt-0.5 w-5 h-5 text-base text-cotto-red/20 opacity-0 group-hover:opacity-100 hover:text-cotto-red transition-opacity"
        >
          ＋
        </button>
      )}
      {!item.done && (
        <button
          onClick={() => onPatch(item.id, { priority: !item.priority })}
          aria-label="toggle priority"
          className={`shrink-0 mt-0.5 w-5 h-5 text-base ${
            item.priority ? "text-cotto-red" : "text-cotto-red/20 hover:text-cotto-red/60"
          }`}
        >
          {item.priority ? "★" : "☆"}
        </button>
      )}
      <button
        onClick={() => onDelete(item.id)}
        aria-label="delete"
        className="shrink-0 mt-0.5 w-5 h-5 text-base text-cotto-red/20 opacity-0 group-hover:opacity-100 hover:text-cotto-red transition-opacity"
      >
        ×
      </button>
    </li>
  );
}
