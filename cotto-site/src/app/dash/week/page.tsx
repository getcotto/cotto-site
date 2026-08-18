import { isAuthorizedServer } from "@/lib/dash/auth";
import { getWeekSnapshot } from "@/lib/dash/week-store";
import Login from "../Login";
import WeekView from "./WeekView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "This Week",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WeekPage() {
  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }
  let snapshot = null;
  let storeError: string | null = null;
  try {
    snapshot = await getWeekSnapshot();
  } catch (e) {
    storeError = e instanceof Error ? e.message : "Storage unavailable";
  }
  return <WeekView snapshot={snapshot} storeError={storeError} />;
}
