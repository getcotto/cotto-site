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
  // What to DO. status alone was a pure function of reorderBy, so components with an open PO
  // already covering them still rendered RED — 8 of 9 at once, which made the panel unreadable.
  //   ORDER = cut a PO now · LATE = already ordered but it lands after a run that needs it
  //   (chase the supplier, don't reorder) · WATCH = order soon · COVERED/OK = nothing to do
  action?: "ORDER" | "LATE" | "WATCH" | "COVERED" | "OK";
  // LATE carries the actual shortfall, not just "a run happens first" — that naive version
  // painted every line red even where on-hand covered the intervening run.
  lateFor?: { run: string; on: string; short?: number; receipt?: string | null; po?: string; confirmed?: boolean };
  leadDays?: number; // planning lead time; edit in spine/packaging.json
  lastOrderedOn?: string; // when we last cut a PO for this component
  expectedBy?: string; // when the open receipt is due
  expectedConfirmed?: boolean; // false = the date is what WE asked for, not what they promised
  runsOutOn?: string; // the date we actually hit zero, not a run id
  // True when this SKU's quantity rests on a run whose batch TOTAL is committed but whose SKU
  // SPLIT was derived (August: 12 batches agreed with Nathan, 4/5/3 inferred from demand mix).
  sizedOnEstimatedSplit?: boolean;
};
export type OpsPackaging = {
  components: OpsPackagingComponent[];
  staleNote?: string; // set when the packaging count is old enough to distrust the reorder dates
};

export type OpsSnapshot = {
  updatedAt: string; // set server-side on POST
  asOf: string; // effective date of the data
  onHand: { buf: number; fo: number; gr: number; total: number };
  // Free-to-promise, from the engine. On-hand alone overstates availability: Meraki pulls ~160 cs
  // a week and open orders sit against it. staleOpen is a data-quality signal — orders still
  // flagged open whose delivery already happened — and is deliberately NOT subtracted.
  committed?: {
    windowEnd: string;
    onHand: { buf: number; fo: number; gr: number; total: number };
    committed: { buf: number; fo: number; gr: number; total: number };
    expected: { buf: number; fo: number; gr: number; total: number };
    freeToPromise: { buf: number; fo: number; gr: number; total: number };
    expectedRows?: Array<{ due: string; account: string; cases: number; everyDays: number }>;
    committedRows?: Array<{ date: string; account: string; sku: string; cases: number; status: string }>;
    staleOpen: { buf: number; fo: number; gr: number; total: number };
    staleOpenRows?: Array<{ date: string; account: string; sku: string; cases: number; status: string }>;
  };
  // Meraki is deliberately absent: once they pick up, it is SOLD. We cannot see how much sits
  // in their DC versus already on store shelves, so reporting it as a position we hold was
  // precision we do not have. (Kendall, 2026-07-21)
  location: { brooklyn: number; edison: number; meraki?: number; inbound: number };
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
  // Capture recency — is the Gmail-dependent sweep still running? Derived by
  // emit-ops-snapshot.js from the newest movement across events.json + orders.json.
  // Drives the top-of-page freshness banner so a frozen pipe is loud, not silent.
  freshness?: {
    lastSwept: string | null; // most recent capture date (events + orders), or null if none
    staleDays: number | null; // days since lastSwept; null when nothing captured yet
    opsViewAsOf: string | null; // the curated view's own asOf (can lag the engine)
    // Per-source freshness so a single dead input (Settle export not pulled, texts not captured,
    // slips piling up unread) shows on its own chip instead of hiding inside the aggregate.
    // Each source reports a real file/mtime signal; a source with no local cache is null.
    sources?: Record<
      string,
      {
        lastIngested: string | null;
        staleDays: number | null;
        backlog?: boolean; // slips: photos arrived that haven't been processed yet
        lastArrived?: string | null; // slips: newest photo landed
        note?: string;
      }
    >;
  };
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
