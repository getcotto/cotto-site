import { isAuthorizedServer } from "@/lib/dash/auth";
import { getFocusSnapshot } from "@/lib/dash/focus-store";
import Login from "../Login";
import FocusView from "./FocusView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function FocusPage() {
  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }
  let snapshot = null;
  let storeError: string | null = null;
  try {
    snapshot = await getFocusSnapshot();
  } catch (e) {
    storeError = e instanceof Error ? e.message : "Storage unavailable";
  }
  return <FocusView snapshot={snapshot} storeError={storeError} />;
}
