import { createClient, type RedisClientType } from "redis";

// The hosted → local bridge for the interactive Focus workbench.
//
// The Focus page runs on the hosted Next app, but the work each button triggers
// (re-triage the inbox, re-draft a reply, push a Gmail draft) can only happen on
// Kendall's machine, where Gmail + the voice files live. So the page does not DO
// the work — it drops a request on a Redis FIFO queue, and a local worker (a
// scheduled task) drains the queue, does the work, and republishes the snapshot.
//
// Two keys, same Redis instance as the focus snapshot (dash:focus:v1):
//   dash:focus:requests — a LIST (RPUSH/LPOP) of pending requests, FIFO.
//   dash:focus:results  — a HASH mapping requestId → JSON status, so the UI can poll
//                         the fate of a request it enqueued.
const QUEUE_KEY = "dash:focus:requests";
const RESULTS_KEY = "dash:focus:results";

// Keep the results hash from growing forever: only retain the newest N.
const RESULTS_CAP = 200;

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

export type FocusRequestType = "refresh" | "regenerate" | "push_to_gmail" | "create_calendar_event";

// The confirmed event details for a create_calendar_event request. Built on the Focus
// board from the agent's proposal after Kendall edits/confirms it.
export type FocusEventInput = {
  title: string;
  startISO: string; // event start, ISO 8601 with timezone offset
  durationMin: number;
  attendees: string[]; // email addresses to invite
  addZoom: boolean; // attach a Zoom meeting link
};

// A single unit of work for the local worker. itemId + feedback are only meaningful
// for the item-scoped types (regenerate/push_to_gmail); refresh is global; event is
// only set for create_calendar_event.
export type FocusRequest = {
  id: string; // stable request id (uuid-ish)
  type: FocusRequestType;
  itemId?: string; // the FocusDraftable.id this acts on (regenerate / push_to_gmail / create_calendar_event)
  feedback?: string; // free-text steer for regenerate ("make it warmer, drop the ask")
  event?: FocusEventInput; // confirmed event details (create_calendar_event)
  createdAt: string; // ISO timestamp, set on enqueue
};

// The worker's report on a request. status walks:
//   queued → working → done | error
// The UI polls this to move an item's local indicator and to know when to re-pull
// the snapshot. `message` carries a short human-readable note (error text, or e.g.
// "draft pushed to Gmail").
export type FocusRequestStatus = {
  id: string;
  type: FocusRequestType;
  itemId?: string;
  status: "queued" | "working" | "done" | "error";
  message?: string;
  createdAt: string;
  updatedAt: string;
};

function makeId(): string {
  // No node: crypto import needed for a queue handle; keep it dependency-free.
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// Enqueue a request from the hosted app. Writes the pending job onto the FIFO list
// AND seeds a "queued" status row so the UI can poll immediately. Returns the full
// request (id included) so the caller can hand the id back to the browser.
export async function enqueueRequest(input: {
  type: FocusRequestType;
  itemId?: string;
  feedback?: string;
  event?: FocusEventInput;
}): Promise<FocusRequest> {
  const c = await client();
  const now = new Date().toISOString();
  const req: FocusRequest = {
    id: makeId(),
    type: input.type,
    itemId: input.itemId,
    feedback: input.feedback,
    event: input.event,
    createdAt: now,
  };
  const status: FocusRequestStatus = {
    id: req.id,
    type: req.type,
    itemId: req.itemId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };
  await c.rPush(QUEUE_KEY, JSON.stringify(req));
  await c.hSet(RESULTS_KEY, req.id, JSON.stringify(status));
  await trimResults(c);
  return req;
}

// Drain every pending request, FIFO. Intended for the LOCAL worker — pops the whole
// backlog at once so a run handles everything queued since the last run. Each drained
// request is also flipped to "working" in the results hash.
export async function drainRequests(): Promise<FocusRequest[]> {
  const c = await client();
  const out: FocusRequest[] = [];
  // LPOP one at a time to preserve FIFO order and tolerate malformed rows.
  for (;;) {
    const raw = await c.lPop(QUEUE_KEY);
    if (raw == null) break;
    let req: FocusRequest;
    try {
      req = JSON.parse(raw) as FocusRequest;
    } catch {
      continue; // skip a corrupt row rather than wedge the queue
    }
    out.push(req);
    await setResult(req.id, {
      id: req.id,
      type: req.type,
      itemId: req.itemId,
      status: "working",
      createdAt: req.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }
  return out;
}

// Write/replace a request's status row. Used by the worker to report done/error and
// by enqueue to seed "queued".
export async function setResult(id: string, status: FocusRequestStatus): Promise<void> {
  const c = await client();
  await c.hSet(RESULTS_KEY, id, JSON.stringify({ ...status, updatedAt: new Date().toISOString() }));
  await trimResults(c);
}

// Mark a request done/error, preserving its type/itemId/createdAt from the seeded
// row. Used by the local worker via POST /api/dash/focus/request/complete. Falls back
// to sane defaults if the original status row has already expired out of the hash.
export async function completeResult(
  id: string,
  status: "done" | "error",
  message?: string
): Promise<void> {
  const existing = await getResult(id);
  const now = new Date().toISOString();
  await setResult(id, {
    id,
    type: existing?.type ?? "refresh",
    itemId: existing?.itemId,
    status,
    message,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

// Read one request's status (UI polling). Null when unknown/expired.
export async function getResult(id: string): Promise<FocusRequestStatus | null> {
  const c = await client();
  const raw = await c.hGet(RESULTS_KEY, id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FocusRequestStatus;
  } catch {
    return null;
  }
}

// Snapshot of the whole queue/results state — pending depth + recent statuses. Handy
// for the GET side of the request route and for debugging.
export async function getQueueState(): Promise<{
  pending: number;
  results: FocusRequestStatus[];
}> {
  const c = await client();
  const pending = await c.lLen(QUEUE_KEY);
  const all = await c.hGetAll(RESULTS_KEY);
  const results: FocusRequestStatus[] = [];
  for (const raw of Object.values(all)) {
    try {
      results.push(JSON.parse(raw) as FocusRequestStatus);
    } catch {
      // skip corrupt row
    }
  }
  results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { pending, results };
}

// Keep only the newest RESULTS_CAP status rows so the hash cannot grow without bound.
async function trimResults(c: RedisClientType): Promise<void> {
  const all = await c.hGetAll(RESULTS_KEY);
  const entries = Object.entries(all);
  if (entries.length <= RESULTS_CAP) return;
  const parsed = entries
    .map(([k, v]) => {
      try {
        return { k, updatedAt: (JSON.parse(v) as FocusRequestStatus).updatedAt || "" };
      } catch {
        return { k, updatedAt: "" };
      }
    })
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)); // oldest first
  const drop = parsed.slice(0, entries.length - RESULTS_CAP).map((e) => e.k);
  if (drop.length) await c.hDel(RESULTS_KEY, drop);
}
