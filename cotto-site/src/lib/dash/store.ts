import { createClient, type RedisClientType } from "redis";
import { CATEGORIES, SOURCES, type Category, type Source, type TodoItem } from "./types";

const KEY = "dash:todos:v1";

let _client: RedisClientType | null = null;
let _connecting: Promise<RedisClientType> | null = null;

async function client(): Promise<RedisClientType> {
  if (_client?.isOpen) return _client;
  if (_connecting) return _connecting;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Missing REDIS_URL env var");
  _connecting = (async () => {
    const c = createClient({ url, socket: { connectTimeout: 10_000 } }) as RedisClientType;
    c.on("error", () => {
      // swallow runtime emit so a single hiccup doesn't crash the process
    });
    await c.connect();
    _client = c;
    return c;
  })();
  try {
    return await _connecting;
  } finally {
    _connecting = null;
  }
}

export async function listTodos(): Promise<TodoItem[]> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TodoItem[]) : [];
  } catch {
    return [];
  }
}

async function writeTodos(items: TodoItem[]): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(items));
}

function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export type CreateInput = {
  text: string;
  category: Category;
  priority?: boolean;
  note?: string;
  source?: Source;
};

export async function createTodo(input: CreateInput): Promise<TodoItem> {
  const text = input.text?.trim();
  if (!text) throw new Error("text required");
  if (!CATEGORIES.includes(input.category)) throw new Error("invalid category");
  const source: Source = input.source && SOURCES.includes(input.source) ? input.source : "kendall";
  const item: TodoItem = {
    id: genId(),
    text,
    category: input.category,
    priority: !!input.priority,
    done: false,
    createdAt: new Date().toISOString(),
    note: input.note?.trim() || undefined,
    source,
  };
  const items = await listTodos();
  items.unshift(item);
  await writeTodos(items);
  return item;
}

export type PatchInput = Partial<Pick<TodoItem, "text" | "category" | "priority" | "done" | "note">>;

export async function patchTodo(id: string, patch: PatchInput): Promise<TodoItem | null> {
  const items = await listTodos();
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return null;
  const current = items[idx];
  const next: TodoItem = { ...current };
  if (typeof patch.text === "string") next.text = patch.text.trim();
  if (patch.category && CATEGORIES.includes(patch.category)) next.category = patch.category;
  if (typeof patch.priority === "boolean") next.priority = patch.priority;
  if (typeof patch.note === "string") next.note = patch.note.trim() || undefined;
  if (typeof patch.done === "boolean") {
    next.done = patch.done;
    next.doneAt = patch.done ? new Date().toISOString() : undefined;
  }
  items[idx] = next;
  await writeTodos(items);
  return next;
}

export async function deleteTodo(id: string): Promise<boolean> {
  const items = await listTodos();
  const next = items.filter((it) => it.id !== id);
  if (next.length === items.length) return false;
  await writeTodos(next);
  return true;
}

export async function archiveOldDone(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
  const items = await listTodos();
  const cutoff = Date.now() - maxAgeMs;
  const next = items.filter((it) => {
    if (!it.done) return true;
    const t = it.doneAt ? Date.parse(it.doneAt) : 0;
    return t > cutoff;
  });
  const removed = items.length - next.length;
  if (removed > 0) await writeTodos(next);
  return removed;
}
