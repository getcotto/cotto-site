import { isAuthorizedServer } from "@/lib/dash/auth";
import { getModelSnapshot } from "@/lib/dash/model-store";
import Login from "../Login";
import ModelView from "./ModelView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ModelPage() {
  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }
  let snapshot = null;
  let storeError: string | null = null;
  try {
    snapshot = await getModelSnapshot();
  } catch (e) {
    storeError = e instanceof Error ? e.message : "Storage unavailable";
  }
  return <ModelView snapshot={snapshot} storeError={storeError} />;
}
