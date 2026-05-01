"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, type Category, type TodoItem } from "@/lib/dash/types";

type Props = {
  initialItems: TodoItem[];
  storeError: string | null;
};

const STORAGE_LAST_CATEGORY = "dash:lastCategory";

export default function Dashboard({ initialItems, storeError }: Props) {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("ops");
  const [priority, setPriority] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [error, setError] = useState<string | null>(storeError);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_LAST_CATEGORY)) as
      | Category
      | null;
    if (saved && CATEGORIES.includes(saved)) setCategory(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_LAST_CATEGORY, category);
  }, [category]);

  const { open, done } = useMemo(() => {
    const open: TodoItem[] = [];
    const done: TodoItem[] = [];
    for (const it of items) (it.done ? done : open).push(it);
    return { open, done };
  }, [items]);

  const grouped = useMemo(() => {
    const m: Record<Category, TodoItem[]> = { ops: [], sales: [], marketing: [], finance: [], admin: [] };
    for (const it of open) m[it.category].push(it);
    for (const k of CATEGORIES) {
      m[k].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
    }
    return m;
  }, [open]);

  async function addItem() {
    const t = text.trim();
    if (!t) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: TodoItem = {
      id: tempId,
      text: t,
      category,
      priority,
      done: false,
      createdAt: new Date().toISOString(),
      source: "kendall",
    };
    setItems((prev) => [optimistic, ...prev]);
    setText("");
    setPriority(false);
    inputRef.current?.focus();
    try {
      const res = await fetch("/api/dash/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t, category, priority }),
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
        <h1 className="font-display text-3xl text-cotto-red">dash</h1>
        <button onClick={logout} className="text-xs text-cotto-red/60 hover:text-cotto-red">
          log out
        </button>
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
              onClick={addItem}
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
          const list = grouped[c];
          if (list.length === 0) return null;
          return (
            <section key={c}>
              <div className="text-xs uppercase tracking-wider text-cotto-red/50 mb-1.5 px-1">
                {CATEGORY_LABEL[c]} <span className="text-cotto-red/30">· {list.length}</span>
              </div>
              <ul className="rounded-2xl border border-black/10 bg-white divide-y divide-black/5 overflow-hidden">
                {list.map((it) => (
                  <Item key={it.id} item={it} onPatch={patch} onDelete={remove} />
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
                <Item key={it.id} item={it} onPatch={patch} onDelete={remove} />
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
  onPatch,
  onDelete,
}: {
  item: TodoItem;
  onPatch: (id: string, p: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

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
      </div>
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
