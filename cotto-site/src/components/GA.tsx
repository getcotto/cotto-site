"use client";

import Script from "next/script";
import { useEffect } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "event" | "config" | "js", ...args: unknown[]) => void;
  }
}

export default function GA() {
  // Bind simple click tracking for CTA and outbound socials
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a[data-analytics]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const eventName = anchor.getAttribute("data-analytics") || "click";
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", eventName, {
          event_category: "engagement",
          event_label: anchor.href || anchor.textContent || "",
        });
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}


