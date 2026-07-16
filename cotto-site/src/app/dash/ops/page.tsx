import { isAuthorizedServer } from "@/lib/dash/auth";
import { getOpsSnapshot } from "@/lib/dash/ops-store";
import Login from "../Login";
import OpsView from "./OpsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OpsPage() {
  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }
  let snapshot = null;
  let storeError: string | null = null;
  try {
    snapshot = await getOpsSnapshot();
  } catch (e) {
    storeError = e instanceof Error ? e.message : "Storage unavailable";
  }
  return <OpsView snapshot={snapshot} storeError={storeError} />;
}
