import { createClient, type RedisClientType } from "redis";

// Retail CRM snapshot: every retailer / distributor / broker relationship, merged from
// Gmail + Notion + Calendar + LinkedIn and mapped against the financial model's door plan.
// Pushed up by cotto-pipeline/emit-crm-snapshot.js, rendered at /dash/crm.
// Same Redis instance as the model dash, ops and to-dos; separate key.
const KEY = "dash:crm:v1";

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

export type CrmContact = {
  name: string;
  role?: string;
  emails: string[];
  source?: string;
  bounced?: boolean;
};

export type CrmStatus = {
  date: string | null;
  src: string;
  text: string;
};

export type CrmAccount = {
  id: string;
  company: string;
  type: "retailer" | "distributor" | "broker" | "buying-group" | "other";
  stage: "live" | "in-talks" | "target" | "passed";
  doors: number | null; // doors we're actually in / their footprint
  plannedDoors: number | null; // from the financial model
  plannedOpen: string | null; // planned open date from the model
  plannedChannel?: string | null;
  inPlan: boolean;
  contacts: CrmContact[];
  lastTouch: string | null;
  nextMeeting: string | null;
  daysSince: number | null;
  owes: "us" | "them" | null;
  due: boolean;
  dueReason: string | null;
  statuses: CrmStatus[];
  reviewWindows: string[];
  thirdParty: string[]; // retailers a distributor/broker said they could open
  threads: string[]; // gmail thread ids
  sources: string[]; // gmail | notion_crm | calendar | linkedin
  aliases: string[];
  notes: string[];
};

// A dated category review / submission window. `cutoff` is the date that actually matters.
export type CrmReview = {
  retailer: string;
  category: string;
  cutoff: string | null;
  reviewStart?: string | null;
  publish?: string | null;
  owner?: string | null; // category manager
  source: string;
  daysToCutoff?: number | null;
};

export type CrmFlag = {
  level: "red" | "amber" | "info";
  text: string;
  account?: string;
  source?: string; // where this was established, so it can be re-verified
};

export type CrmDoorPeriod = {
  period: string; // "2026-08"
  planned: number; // doors planned to open in this period
  cumulative: number;
};

export type CrmSnapshot = {
  updatedAt: string; // set server-side on POST
  asOf: string;
  doors: {
    liveNow: number;
    plannedNow: number;
    byPeriod: CrmDoorPeriod[];
  };
  accounts: CrmAccount[];
  reviews: CrmReview[];
  flags: CrmFlag[];
  coverage?: {
    records: number;
    accounts: number;
    sources: string[];
    note?: string;
  };
};

export async function getCrmSnapshot(): Promise<CrmSnapshot | null> {
  const c = await client();
  const raw = await c.get(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CrmSnapshot;
  } catch {
    return null;
  }
}

export async function setCrmSnapshot(snapshot: CrmSnapshot): Promise<void> {
  const c = await client();
  await c.set(KEY, JSON.stringify(snapshot));
}
