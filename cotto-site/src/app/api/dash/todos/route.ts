import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/dash/auth";
import { archiveOldDone, createTodo, listTodos } from "@/lib/dash/store";
import { CATEGORIES, SOURCES, type Category, type Source } from "@/lib/dash/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await archiveOldDone();
  const items = await listTodos();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: {
    text?: string;
    category?: string;
    priority?: boolean;
    note?: string;
    source?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const text = (body.text ?? "").toString();
  const category = (body.category ?? "") as Category;
  if (!text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }
  const source: Source = body.source && (SOURCES as readonly string[]).includes(body.source)
    ? (body.source as Source)
    : "kendall";
  const item = await createTodo({
    text,
    category,
    priority: !!body.priority,
    note: body.note?.toString(),
    source,
  });
  return NextResponse.json({ item }, { status: 201 });
}
