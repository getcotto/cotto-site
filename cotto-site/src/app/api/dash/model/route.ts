import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { getModelSnapshot, setModelSnapshot, type ModelSnapshot } from "@/lib/dash/model-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: read the current model snapshot (for the /dash/model page).
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snapshot = await getModelSnapshot();
  return NextResponse.json({ snapshot });
}

// POST: replace the snapshot. Called by the local pipeline (emit-snapshot.js) with the Bearer token.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: ModelSnapshot;
  try {
    body = (await req.json()) as ModelSnapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.inventory)) {
    return NextResponse.json({ error: "inventory array required" }, { status: 400 });
  }
  const snapshot: ModelSnapshot = { ...body, updatedAt: new Date().toISOString() };
  await setModelSnapshot(snapshot);
  return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt }, { status: 201 });
}
