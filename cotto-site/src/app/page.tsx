"use client";

import dynamic from "next/dynamic";
const KlaviyoForm = dynamic(() => import("@/components/KlaviyoForm"), { ssr: false });
const TikTokEmbed = dynamic(() => import("@/components/TikTokEmbed"), { ssr: false });

export default function HomePage() {
  return (
    <div className="font-body">
      {/* Hero Section */}
      <section className="py-16 text-center">
        <h1 className="text-5xl font-extrabold mb-3 text-brand-red font-display">COTTO</h1>
        <h2 className="text-3xl font-bold mb-2 font-display text-brand-red">High-protein, clean ingredient, <span className="font-bold italic">cottage cheese-based dips</span></h2>
        <p className="text-base mb-6 text-brand-red/90">Be the first to know when & where you can dip.</p>
        
        {/* Inline Klaviyo signup form */}
        <div className="max-w-md mx-auto">
          <KlaviyoForm />
        </div>
      </section>

      {/* TikTok Section */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold mb-6 font-display text-brand-red">Follow along our journey to launch</h2>
        <div className="flex flex-col md:flex-row gap-4 md:gap-3 justify-center items-center max-w-2xl mx-auto">
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542615383367224631" />
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542925693361900855" />
        </div>
      </section>
    </div>
  );
}
