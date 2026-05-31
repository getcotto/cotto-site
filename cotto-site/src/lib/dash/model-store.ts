import { createClient, type RedisClientType } from "redis";

// Read-only S&OP model snapshot, pushed up from the local pipeline (cotto-pipeline/emit-snapshot.js)
// and rendered at /dash/model. Same Redis instance as the to-dos, separate key.
const KEY = "dash:model:v1";

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

export type SkuInventory = {
  sku: string; // "BUF" | "FO" | "GR"
  sellable: number; // cases available to sell
  held: number; // cases on hold / quarantined (not sellable)
  weeksOfSupply: number | null;
  lots?: Array<{ lot: string; cases: number; bbd?: string; status?: string }>;
};

export type ModelSnapshot = {
  updatedAt: string; // set server-side on POST
  asOf?: string; // the model's effective date
  inventory: SkuInventory[];
  flags?: Array<{ level: "red" | "amber" | "info"; text: string }>;
  deliveries?: Array<{ account: string; cases: number; date: string; status?: string }>;
  cash?: { runwayWeeks: number | null; minBalance: number | null; note?: string };
  notes?: string[];
};

export async function getModelSnapshot(): Promise<ModelSnapshot | null> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ModelSnapshot;
  } catch {
    return null;
  }
}

export async function setModelSnapshot(snapshot: ModelSnapshot): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(snapshot));
}
