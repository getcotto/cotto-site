import { createClient, type RedisClientType } from "redis";

// "This Week" cadence snapshot — the SAME computed cadence the daily Telegram push sends, rendered on the
// dash as a read-only view. Pushed up from the spine (cotto-pipeline/emit_week_snapshot.js, which groups the
// rows through the ONE shared renderer engine/render_cadence.js `tiers()`), so the dash and the push can
// never disagree about what needs Kendall this week. Same Redis instance as ops/model/to-dos, separate key.
const KEY = "dash:week:v1";

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

export type WeekRow = {
  step: string;
  why?: string;
  dueDate?: string | null;
  dueDow?: string | null;
  status: string; // now | draft-due | draft | wip | soon | done
  loop?: string; // Sales | Production
  key?: string;
};

export type WeekSnapshot = {
  updatedAt: string; // set server-side on POST
  asOf: string | null; // effective date of the cadence
  stale: boolean; // freshness gate — when true the UI hedges every red to "check, not act"
  freshness?: {
    oldestInput?: string | null;
    ageDays?: number | null;
    stale?: boolean;
  } | null;
  doneCount: number;
  // Pre-grouped by the shared renderer's tiers — the dash renders these directly, no tier logic here.
  today: WeekRow[]; // 🔴 needs you today (tasks due now)
  motion: WeekRow[]; // ⏳ in motion (awaiting a confirmation)
  call: WeekRow[]; // 🤔 your call (a decision, not a task)
  next?: WeekRow | null; // the next 'soon' item, for the zero-state
};

export async function getWeekSnapshot(): Promise<WeekSnapshot | null> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WeekSnapshot;
  } catch {
    return null;
  }
}

export async function setWeekSnapshot(snapshot: WeekSnapshot): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(snapshot));
}
