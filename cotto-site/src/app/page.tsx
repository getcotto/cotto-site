"use client";

import dynamic from "next/dynamic";
const KlaviyoForm = dynamic(() => import("@/components/KlaviyoForm"), { ssr: false });
const TikTokEmbed = dynamic(() => import("@/components/TikTokEmbed"), { ssr: false });

export default function HomePage() {
  return (
    <div className="font-body">
      {/* Hero Section */}
      <section className="py-24 text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-[#7c1d1d] font-display">COTTO</h1>
        <h2 className="text-3xl font-bold mb-2 font-display">Elevated Cottage Cheese–Based Dips</h2>
        <p className="text-lg mb-6 text-black/70">High protein, clean ingredients, elevated flavors.</p>
        
        {/* Inline Klaviyo signup form */}
        <div className="max-w-md mx-auto">
          <div className="klaviyo-form-WsTrqm" />
        </div>
      </section>

      {/* About Snippet */}
      <section className="container py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold font-display">About COTTO</h2>
            <p className="mt-2 text-black/70 max-w-prose">
              We're bringing elevated, protein-forward cottage cheese dips to your favorite
              flavors—made to share, with clean ingredients and zero fuss.
            </p>
          </div>
          <a href="/about" className="text-[color:var(--cotto-blue)] underline underline-offset-4">
            Learn More →
          </a>
        </div>
      </section>

      {/* TikTok Section */}
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold mb-8 font-display">Follow along our journey to launch</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542615383367224631" />
          <TikTokEmbed url="https://www.tiktok.com/@getcotto/video/7542925693361900855" />
        </div>
      </section>
    </div>
  );
}
