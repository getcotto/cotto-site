import { createClient, type RedisClientType } from "redis";

// Focus briefing snapshot: the inbox agent's triage digest, ranked into a daily
// driver — the top few things that need Kendall, plus the categorized buckets
// (respond now / can wait / needs a call / FYI). Pushed up by the inbox sweep,
// rendered at /dash/focus. Same Redis instance as the model dash, ops and CRM;
// separate key.
const KEY = "dash:focus:v1";

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

// Who owes the next move. "you" = Kendall owes the reply/action; "them" = we're
// waiting on the other side. Drives the visual you-vs-them distinction.
export type FocusOwes = "you" | "them";

// Draft lifecycle for the interactive workbench. An item with a proposed reply moves
//   none → generating → ready → pushed
// none = no draft yet (agent hasn't written one) · generating = a request is in flight
// with the local worker (refresh/regenerate) · ready = draftText is written and waiting
// on Kendall · pushed = the worker created the Gmail draft (draftId set); it is a DRAFT
// in Gmail, still never sent. The UI never treats "pushed" as sent.
export type FocusDraftState = "none" | "generating" | "ready" | "pushed";

// Fields shared by any item that can carry an interactive draft (focus rows + bucket
// rows). All optional so older snapshots deserialize unchanged (backward-compatible).
export type FocusDraftable = {
  id?: string; // stable string id — the handle for regenerate/push requests
  summary?: string; // 1-2 sentence plain-English recap of what THEY emailed
  draftText?: string; // the proposed reply body, plain text — NOT sent
  draftState?: FocusDraftState; // lifecycle; treat missing as "none"
  threadId?: string; // Gmail thread id, for the worker to draft in-thread
  draftId?: string; // Gmail draft id once the worker pushes it
  // The latest message in the thread, so Kendall reads current state without opening
  // Gmail. Always the most recent non-draft message (hers or theirs); refreshed each
  // re-triage.
  lastEmail?: {
    from?: string; // sender of the latest message
    receivedAt?: string; // date/time header of that message
    text?: string; // plain-text body of the latest message
  };
  // Follow-through commitments the agent detected in the thread (things KENDALL said
  // she/Cotto would do) — surfaced as suggested to-dos she accepts with one click.
  // Never auto-added to her to-do list; proposals only.
  proposedTodos?: { text: string; category?: string }[];
};

// One ranked top item — the daily driver rows. A draftUrl means a reply is ALREADY
// staged (never sent); the view labels it "draft ready (not sent)" so it can never
// be misread as done.
export type FocusItem = FocusDraftable & {
  rank: number;
  who: string;
  account?: string;
  action: string; // the one thing to do
  why: string; // short reason it's ranked here
  draftUrl?: string; // staged draft — NOT sent
  threadUrl?: string;
};

// A compact bucket row (respond now / can wait / FYI).
export type FocusBucketItem = FocusDraftable & {
  who: string;
  what: string;
  owes: FocusOwes;
  draftUrl?: string; // staged draft — NOT sent
  threadUrl?: string;
};

// A decision Kendall has to make — no draft, a question to answer.
export type FocusDecisionItem = {
  who: string;
  question: string;
};

export type FocusSnapshot = {
  updatedAt: string; // set server-side on POST
  unreadCount: number;
  categorizedCount: number;
  counts: {
    focus: number;
    respondNow: number;
    canWait: number;
    fyi: number;
    needsDecision: number;
    noResponse: number;
  };
  focus: FocusItem[]; // the ranked top 3-5
  buckets: {
    respondNow: FocusBucketItem[];
    canWait: FocusBucketItem[];
    fyi: FocusBucketItem[];
    needsDecision: FocusDecisionItem[];
  };
  owesRollup: string[]; // short "you owe the move on" list
};

export async function getFocusSnapshot(): Promise<FocusSnapshot | null> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FocusSnapshot;
  } catch {
    return null;
  }
}

export async function setFocusSnapshot(snapshot: FocusSnapshot): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(snapshot));
}
