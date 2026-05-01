import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const COOKIE_NAME = "dash_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function getSecret(): string | null {
  return process.env.DASH_SECRET || null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function isAuthorizedRequest(req: NextRequest): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie && timingSafeEqual(cookie, secret)) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (timingSafeEqual(token, secret)) return true;
  }
  return false;
}

export async function isAuthorizedServer(): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  return !!v && timingSafeEqual(v, secret);
}

export function checkPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  return timingSafeEqual(password, secret);
}

export function buildSessionCookie(): {
  name: string;
  value: string;
  options: { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number };
} {
  const secret = getSecret();
  if (!secret) throw new Error("DASH_SECRET not set");
  return {
    name: COOKIE_NAME,
    value: secret,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    },
  };
}
