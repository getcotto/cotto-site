import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { getWeekSnapshot, setWeekSnapshot, type WeekSnapshot } from "@/lib/dash/week-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: read the current "This Week" cadence snapshot (for the /dash/week page).
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snapshot = await getWeekSnapshot();
  return NextResponse.json({ snapshot });
}

// POST: replace the snapshot. Called by the spine publisher (emit_week_snapshot.js) with the Bearer token.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: WeekSnapshot;
  try {
    body = (await req.json()) as WeekSnapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.today) || !Array.isArray(body.motion) || !Array.isArray(body.call)) {
    return NextResponse.json({ error: "today/motion/call arrays required" }, { status: 400 });
  }
  const snapshot: WeekSnapshot = { ...body, updatedAt: new Date().toISOString() };
  await setWeekSnapshot(snapshot);
  return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt }, { status: 201 });
}
