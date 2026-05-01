import { Redis } from "@upstash/redis";
import { CATEGORIES, SOURCES, type Category, type Source, type TodoItem } from "./types";

const KEY = "dash:todos:v1";

let _redis: Redis | null = null;
function redis(): Redis {
  if (_redis) return _redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Missing KV/Upstash env vars (KV_REST_API_URL, KV_REST_API_TOKEN)");
  }
  _redis = new Redis({ url, token });
  return _redis;
}

export async function listTodos(): Promise<TodoItem[]> {
  const raw = await redis().get<TodoItem[] | string>(KEY);
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as TodoItem[];
    } catch {
      return [];
    }
  }
  return raw;
}

async function writeTodos(items: TodoItem[]): Promise<void> {
  await redis().set(KEY, JSON.stringify(items));
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
