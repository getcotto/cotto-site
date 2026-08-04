import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { getFocusSnapshot, setFocusSnapshot, type FocusSnapshot } from "@/lib/dash/focus-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: read the current focus snapshot (for the /dash/focus page).
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snapshot = await getFocusSnapshot();
  return NextResponse.json({ snapshot });
}

// POST: replace the snapshot. Called with the Bearer token by the inbox triage
// sweep, which can run locally or from the cloud.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: FocusSnapshot;
  try {
    body = (await req.json()) as FocusSnapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.focus) || !body.buckets) {
    return NextResponse.json({ error: "focus array and buckets required" }, { status: 400 });
  }
  const snapshot: FocusSnapshot = { ...body, updatedAt: new Date().toISOString() };
  await setFocusSnapshot(snapshot);
  return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt }, { status: 201 });
}
