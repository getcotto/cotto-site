import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { getCrmSnapshot, setCrmSnapshot, type CrmSnapshot } from "@/lib/dash/crm-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: read the current CRM snapshot (for the /dash/crm page).
export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snapshot = await getCrmSnapshot();
  return NextResponse.json({ snapshot });
}

// POST: replace the snapshot. Called with the Bearer token by the refresh job
// (cotto-pipeline/emit-crm-snapshot.js), which can run locally or from the cloud.
export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: CrmSnapshot;
  try {
    body = (await req.json()) as CrmSnapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.accounts)) {
    return NextResponse.json({ error: "accounts array required" }, { status: 400 });
  }
  // Refuse to clobber a good snapshot with an empty one -- a failed upstream sweep
  // should leave the last known-good CRM in place rather than blank the page.
  if (body.accounts.length === 0) {
    const existing = await getCrmSnapshot();
    if (existing && existing.accounts.length > 0) {
      return NextResponse.json(
        { error: "refusing to overwrite non-empty snapshot with zero accounts" },
        { status: 409 },
      );
    }
  }
  const snapshot: CrmSnapshot = { ...body, updatedAt: new Date().toISOString() };
  await setCrmSnapshot(snapshot);
  return NextResponse.json(
    { ok: true, updatedAt: snapshot.updatedAt, accounts: snapshot.accounts.length },
    { status: 201 },
  );
}
