import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { getOpsSnapshot, setOpsSnapshot, type OpsSnapshot } from "@/lib/dash/ops-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: read the current ops snapshot (for the /dash/ops page).
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snapshot = await getOpsSnapshot();
  return NextResponse.json({ snapshot });
}

// POST: replace the snapshot. Called by the local pipeline (emit-ops-snapshot.js) with the Bearer token.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: OpsSnapshot;
  try {
    body = (await req.json()) as OpsSnapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.lots)) {
    return NextResponse.json({ error: "lots array required" }, { status: 400 });
  }
  const snapshot: OpsSnapshot = { ...body, updatedAt: new Date().toISOString() };
  await setOpsSnapshot(snapshot);
  return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt }, { status: 201 });
}
