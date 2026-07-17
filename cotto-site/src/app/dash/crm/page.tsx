import { isAuthorizedServer } from "@/lib/dash/auth";
import { getCrmSnapshot } from "@/lib/dash/crm-store";
import Login from "../Login";
import CrmView from "./CrmView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retail CRM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CrmPage() {
  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }
  let snapshot = null;
  let storeError: string | null = null;
  try {
    snapshot = await getCrmSnapshot();
  } catch (e) {
    storeError = e instanceof Error ? e.message : "Storage unavailable";
  }
  return <CrmView snapshot={snapshot} storeError={storeError} />;
}
