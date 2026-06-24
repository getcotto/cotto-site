import { isAuthorizedServer, isConfigured } from "@/lib/dilution/auth";
import Login from "./Login";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cotto Leads",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LeadsPage() {
  if (!isConfigured()) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
        <p className="text-sm text-cotto-red/70 max-w-sm">
          This page isn&apos;t configured yet. Set the <code>DILUTION_SECRET</code>{" "}
          environment variable in Vercel and redeploy.
        </p>
      </div>
    );
  }

  const authed = await isAuthorizedServer();
  if (!authed) {
    return <Login />;
  }

  return (
    <iframe
      src="/leads/app"
      title="Cotto Booth Tool"
      style={{ width: "100%", height: "100vh", border: "0", display: "block" }}
    />
  );
}
