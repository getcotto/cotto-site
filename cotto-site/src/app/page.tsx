"use client";

import KlaviyoForm from "@/components/KlaviyoForm";
import dynamic from "next/dynamic";
const TikTokEmbed = dynamic(() => import("@/components/TikTokEmbed"), { ssr: false });

export default function HomePage() {
  return (
    <div className="font-body">
      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pb-32 px-6 text-center">
        <h1 className="text-5xl font-extrabold mb-3 text-brand-red font-display">COTTO</h1>
        <h2 className="text-3xl font-bold mb-2 font-display text-brand-red">High-protein, clean ingredient, <span className="font-bold italic">cottage cheese-based dips</span></h2>
        <p className="text-base mb-6 mt-8 text-brand-red/90">Be the first to know when & where you can dip.</p>
        
        {/* Inline Klaviyo signup form */}
        <div className="max-w-md mx-auto">
          <KlaviyoForm />
        </div>
      </section>

      {/* TikTok Section - hidden on mobile, visible on desktop */}
      <section className="hidden md:block py-12 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-6 font-display text-brand-red">Follow along our journey to launch</h2>
        <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542615383367224631" />
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542925693361900855" />
        </div>
      </section>
    </div>
  );
}
