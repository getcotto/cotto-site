import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { createClient, type RedisClientType } from "redis";

// THROWAWAY probe endpoint — validates that a cloud routine can hold a token and make an
// authenticated WRITE that actually lands in the store. POST bumps a counter + timestamp;
// GET reads it back so we can confirm from anywhere. Delete after the architecture is proven.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "dash:ping-write:v1";
let _c: RedisClientType | null = null;
async function client(): Promise<RedisClientType> {
  if (_c?.isOpen) return _c;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Missing REDIS_URL");
  const c = createClient({ url, socket: { connectTimeout: 10_000 } }) as RedisClientType;
  c.on("error", () => {});
  await c.connect();
  _c = c;
  return c;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const c = await client();
  const raw = await c.get(KEY);
  return NextResponse.json({ ping: raw ? JSON.parse(raw) : null });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { note?: unknown; from?: unknown } = {};
  try {
    body = (await req.json()) as { note?: unknown; from?: unknown };
  } catch {
    // empty body is fine
  }
  const c = await client();
  const raw = await c.get(KEY);
  const prev = raw ? (JSON.parse(raw) as { count?: number }) : { count: 0 };
  const rec = {
    at: new Date().toISOString(),
    count: (prev.count ?? 0) + 1,
    note: String(body.note ?? "").slice(0, 200),
    from: String(body.from ?? "").slice(0, 80),
  };
  await c.set(KEY, JSON.stringify(rec));
  return NextResponse.json({ ok: true, ...rec }, { status: 201 });
}
