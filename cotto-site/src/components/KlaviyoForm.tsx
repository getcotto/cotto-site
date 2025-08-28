"use client";

import Script from "next/script";
import { useEffect } from "react";

type Props = {
  formId: string;
};

const COMPANY_ID = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID;

type KlaviyoMessage = {
  type?: string;
  event?: string;
};

export default function KlaviyoForm({ formId }: Props) {
  useEffect(() => {
    // Listen for Klaviyo form success to send GA event
    function handleMessage(event: MessageEvent) {
      try {
        const data = event.data as KlaviyoMessage;
        if (
          data &&
          typeof data === "object" &&
          data.type === "klaviyoForms" &&
          data.event === "submitSuccess"
        ) {
          if (typeof window.gtag === "function") {
            window.gtag("event", "waitlist_submit", { event_category: "engagement" });
          }
        }
      } catch {}
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <div className={`klaviyo-form-${formId}`}></div>
      {COMPANY_ID ? (
        <Script
          id="klaviyo-embed"
          src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${COMPANY_ID}`}
          strategy="afterInteractive"
          async
        />
      ) : (
        <div className="text-sm text-red-700">
          Missing NEXT_PUBLIC_KLAVIYO_COMPANY_ID environment variable.
        </div>
      )}
    </>
  );
}


