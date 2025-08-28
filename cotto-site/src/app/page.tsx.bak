import Image from "next/image";
import KlaviyoForm from "@/components/KlaviyoForm";

export default function Home() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative">
        <div className="container py-16 sm:py-24 grid gap-6 sm:grid-cols-2 items-center">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Elevated cottage cheese–based dips.
            </h1>
            <p className="text-lg text-black/70">
              Clean protein, classic flavors, zero fuss.
            </p>
            <a
              href="#waitlist"
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--cotto-red)] text-white px-6 py-3 text-base font-medium hover:opacity-90"
              data-analytics="cta_click"
            >
              Join the Waitlist
            </a>
          </div>
          <div className="aspect-[4/3] relative bg-white rounded-lg overflow-hidden ring-1 ring-black/5">
            <Image src="/hero/home-hero.jpg" alt="COTTO lifestyle" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* About Snippet */}
      <section className="container py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold">About COTTO</h2>
            <p className="mt-2 text-black/70 max-w-prose">
              We’re bringing elevated, protein-forward cottage cheese dips to your favorite
              flavors—made to share, with clean ingredients and zero fuss.
            </p>
          </div>
          <a href="/about" className="text-[color:var(--cotto-blue)] underline underline-offset-4">
            Meet Kendall →
          </a>
        </div>
      </section>

      {/* Waitlist (Klaviyo) */}
      <section id="waitlist" className="container py-12 sm:py-16">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold">Join the COTTO waitlist</h3>
          <p className="mt-2 text-black/70">
            Be the first to know when & where you can try our elevated, protein-packed dips.
          </p>
        </div>
        <div className="mt-6">
          <KlaviyoForm formId="WsTrqm" />
        </div>
      </section>
    </div>
  );
}
