import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, checkPassword } from "@/lib/dilution/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const password = (body.password ?? "").toString();
  if (!password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "incorrect password" }, { status: 401 });
  }
  const cookie = buildSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dilution_session", "", { path: "/", maxAge: 0 });
  return res;
}
