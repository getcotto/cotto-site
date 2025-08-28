import Image from "next/image";

export const metadata = {
  title: "About — COTTO",
};

export default function AboutPage() {
  return (
    <div className="font-sans">
      <section className="relative">
        <div className="container py-16 sm:py-24 grid gap-6 sm:grid-cols-2 items-center">
          <div className="aspect-[4/3] relative bg-white rounded-lg overflow-hidden ring-1 ring-black/5">
            <Image src="/hero/about-hero.jpg" alt="COTTO founder" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Meet Kendall</h1>
            <p className="mt-4 text-black/70 max-w-prose">
              COTTO was born from a love of classic dips and a desire for cleaner,
              protein-forward options. We craft elevated cottage cheese dips that are
              bold, familiar, and ready to share.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <h2 className="text-2xl font-semibold">Our values</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="p-6 bg-white rounded-lg ring-1 ring-black/5">
            <h3 className="font-medium">Clean protein made simple</h3>
            <p className="mt-2 text-black/70">High-quality ingredients without the fuss.</p>
          </div>
          <div className="p-6 bg-white rounded-lg ring-1 ring-black/5">
            <h3 className="font-medium">Elevated classic flavors</h3>
            <p className="mt-2 text-black/70">Familiar favorites with a modern, craveable twist.</p>
          </div>
          <div className="p-6 bg-white rounded-lg ring-1 ring-black/5">
            <h3 className="font-medium">Ready-to-dip convenience</h3>
            <p className="mt-2 text-black/70">Grab, share, and enjoy anywhere.</p>
          </div>
        </div>
      </section>
    </div>
  );
}


