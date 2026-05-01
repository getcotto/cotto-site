import { isAuthorizedServer } from "@/lib/dash/auth";
import { archiveOldDone, listTodos } from "@/lib/dash/store";
import Dashboard from "./Dashboard";
import Login from "./Login";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dash",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashPage() {
  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }
  let initialItems: Awaited<ReturnType<typeof listTodos>> = [];
  let storeError: string | null = null;
  try {
    await archiveOldDone();
    initialItems = await listTodos();
  } catch (e) {
    storeError = e instanceof Error ? e.message : "Storage unavailable";
  }
  return <Dashboard initialItems={initialItems} storeError={storeError} />;
}
