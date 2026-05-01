import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { deleteTodo, patchTodo, type PatchInput } from "@/lib/dash/store";
import { CATEGORIES, type Category } from "@/lib/dash/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const patch: PatchInput = {};
  if (typeof body.text === "string") patch.text = body.text;
  if (typeof body.category === "string") {
    if (!CATEGORIES.includes(body.category as Category)) {
      return NextResponse.json({ error: "invalid category" }, { status: 400 });
    }
    patch.category = body.category as Category;
  }
  if (typeof body.priority === "boolean") patch.priority = body.priority;
  if (typeof body.done === "boolean") patch.done = body.done;
  if (typeof body.note === "string") patch.note = body.note;
  const item = await patchTodo(id, patch);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deleteTodo(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
