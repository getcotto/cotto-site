import { createClient, type RedisClientType } from "redis";

// Read-only ops command-center snapshot, pushed up from the local pipeline
// (cotto-pipeline/emit-ops-snapshot.js) and rendered at /dash/ops. Same Redis
// instance as the model dash + to-dos, separate key.
const KEY = "dash:ops:v1";

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

export type OpsLot = {
  name: string; // e.g. "6/15 run"
  bestBy: string; // e.g. "Aug 14-16"
  buf: number;
  fo: number;
  gr: number;
  cases: number;
  location: string; // "Brooklyn" | "Edison" | "Meraki" | "Inbound"
  merakiUntil?: string; // Meraki eligibility cutoff (best-by - 30)
  directUntil?: string; // direct-door cutoff (best-by - floor)
  note?: string;
};

export type OpsOrder = {
  account: string;
  channel: string; // "Carriacou" | "Localee" | "Meraki"
  buf: number | null;
  fo: number | null;
  gr: number | null;
  cases: number | null;
  status: string; // "confirmed" | "to deliver" | "delivered" | "submitted" | "unconfirmed"
};

export type OpsLedgerRow = {
  date: string;
  label: string;
  buf?: number;
  fo?: number;
  gr?: number;
  total: number;
  source: string;
  excluded?: boolean; // shown but not summed (e.g. pre-count route)
};

export type OpsRun = {
  run: string;
  batches: string; // "3 / 5 / 4"
  cases: string; // "796" or "668 / 606"
  lands?: string;
  bestBy?: string;
  status: string;
};

export type OpsHistoryRow = {
  month: string;
  shipped: number;
  mix?: string; // "32 / 41 / 27"
  signal?: string;
};

// Packaging reorder alerts — sourced from the committed engine JSON (spine/packaging_status.json)
// by emit-ops-snapshot.js. Only components that need action (RED/AMBER) are sent up.
export type OpsPackagingComponent = {
  label: string; // e.g. "Wrap Label - Buffalo"
  supplier: string; // e.g. "ATL" | "The Cary Company"
  onHand: number;
  reorderBy: string | null; // ISO date, or null if not yet due
  status: "RED" | "AMBER";
  orderQty: number; // suggested order quantity (order-up-to − position)
};
export type OpsPackaging = {
  components: OpsPackagingComponent[];
  staleNote?: string; // set when the packaging count is old enough to distrust the reorder dates
};

export type OpsSnapshot = {
  updatedAt: string; // set server-side on POST
  asOf: string; // effective date of the data
  onHand: { buf: number; fo: number; gr: number; total: number };
  location: { brooklyn: number; edison: number; meraki: number; inbound: number };
  directFloorDays?: number; // shelf-life floor used for the direct-door column
  lots: OpsLot[];
  orders: OpsOrder[];
  ledger: OpsLedgerRow[];
  pipeline: OpsRun[];
  augustPlan?: { runs: OpsRun[]; totalBatches: number; totalCases: number; dueDate?: string; note?: string };
  packaging?: OpsPackaging;
  history?: OpsHistoryRow[];
  flags?: Array<{ level: "red" | "amber" | "info"; text: string }>;
  notes?: string[];
};

export async function getOpsSnapshot(): Promise<OpsSnapshot | null> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OpsSnapshot;
  } catch {
    return null;
  }
}

export async function setOpsSnapshot(snapshot: OpsSnapshot): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(snapshot));
}
