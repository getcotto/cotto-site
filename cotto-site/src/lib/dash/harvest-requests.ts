import { createClient, type RedisClientType } from "redis";

// The "capture last meeting" bridge for the to-do dashboard.
//
// The dash button can't read Zoom (the rich notetaker notes only flow through the
// in-app connector on Kendall's machine). So the button doesn't DO the capture — it
// raises a single pending flag, and a local in-app listener (a scheduled task) polls
// that flag every few minutes and runs the real meeting-harvest when it's set.
//
// This is deliberately NOT the focus request queue (dash:focus:requests): the focus
// worker drains that queue every 15s and would consume + choke on a harvest request.
// A separate one-key flag keeps the two bridges fully independent.
//
//   dash:harvest:pending — an ISO timestamp string, present iff a capture is pending.
//
// Same Redis instance as the focus snapshot/queue (REDIS_URL).
const PENDING_KEY = "dash:harvest:pending";

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

// Raise the pending flag (button press). NX so rapid double-clicks coalesce into one
// pending capture, keeping the original request time. Returns the effective timestamp.
export async function requestHarvest(): Promise<{ since: string }> {
  const c = await client();
  const now = new Date().toISOString();
  await c.set(PENDING_KEY, now, { NX: true });
  const since = (await c.get(PENDING_KEY)) ?? now;
  return { since };
}

// Atomically read + clear the flag (the in-app listener's claim). pending is true when
// a capture was waiting; the caller then runs the harvest exactly once.
export async function claimHarvest(): Promise<{ pending: boolean; since: string | null }> {
  const c = await client();
  const since = await c.getDel(PENDING_KEY);
  return { pending: !!since, since: since ?? null };
}

// Non-destructive read (UI/status). true iff a capture is currently pending.
export async function getHarvestState(): Promise<{ pending: boolean; since: string | null }> {
  const c = await client();
  const since = await c.get(PENDING_KEY);
  return { pending: !!since, since: since ?? null };
}
