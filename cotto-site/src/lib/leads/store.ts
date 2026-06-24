import { createClient, type RedisClientType } from "redis";

const KEY = "leads:unfi:v1";

export type Lead = {
  id: string;
  store?: string;
  contact?: string;
  skus?: string;
  temp?: string;
  review?: string;
  notes?: string;
  photo?: string;
  ts?: string;
};

let _client: RedisClientType | null = null;
let _connecting: Promise<RedisClientType> | null = null;

async function client(): Promise<RedisClientType> {
  if (_client?.isOpen) return _client;
  if (_connecting) return _connecting;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Missing REDIS_URL env var");
  _connecting = (async () => {
    const c = createClient({ url, socket: { connectTimeout: 10_000 } }) as RedisClientType;
    c.on("error", () => {});
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

export async function listLeads(): Promise<Lead[]> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}

async function writeLeads(items: Lead[]): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(items));
}

export async function upsertLead(lead: Lead): Promise<Lead[]> {
  if (!lead || !lead.id) throw new Error("lead.id required");
  const items = await listLeads();
  const idx = items.findIndex((l) => l.id === lead.id);
  if (idx === -1) items.unshift(lead);
  else items[idx] = lead;
  await writeLeads(items);
  return items;
}

export async function deleteLead(id: string): Promise<Lead[]> {
  const items = await listLeads();
  const next = items.filter((l) => l.id !== id);
  await writeLeads(next);
  return next;
}
