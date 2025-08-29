"use client";

import KlaviyoForm from "@/components/KlaviyoForm";
import dynamic from "next/dynamic";
const TikTokEmbed = dynamic(() => import("@/components/TikTokEmbed"), { ssr: false });

export default function HomePage() {
  return (
    <div className="font-body">
      {/* Hero Section */}
      <section className="pt-32 pb-48 md:pb-16 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-3 text-brand-red font-display whitespace-nowrap">COTTO</h1>
        <h2 className="text-sm md:text-xl font-bold mb-2 font-display text-brand-red italic whitespace-nowrap">Cottage cheese-based dips</h2>
        <h3 className="text-lg md:text-2xl font-bold mb-2 font-display text-brand-red whitespace-nowrap">High protein. Clean ingredients. Elevated flavors.</h3>
        <p className="text-base mb-6 mt-8 text-brand-red/90">Be the first to know when & where you can dip.</p>
        
        {/* Inline Klaviyo signup form */}
        <div className="max-w-md mx-auto">
          <KlaviyoForm />
        </div>
      </section>

      {/* TikTok Section - pushed down on mobile, normal spacing on desktop */}
      <section className="py-12 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-6 font-display text-brand-red">Follow along our journey to launch</h2>
        <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542615383367224631" />
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542925693361900855" />
        </div>
      </section>
    </div>
  );
}
