import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dilution/auth";
import { listLeads, upsertLead, deleteLead, type Lead } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard(req: NextRequest): NextResponse | null {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    const leads = await listLeads();
    return NextResponse.json({ leads }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "store error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  let body: { lead?: Lead } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const lead = body.lead;
  if (!lead || !lead.id) {
    return NextResponse.json({ error: "lead.id required" }, { status: 400 });
  }
  try {
    const leads = await upsertLead(lead);
    return NextResponse.json({ ok: true, count: leads.length });
  } catch {
    return NextResponse.json({ error: "store error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "store error" }, { status: 500 });
  }
}
