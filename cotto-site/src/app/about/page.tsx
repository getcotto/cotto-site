"use client";
import Section from "@/components/Section";

export default function AboutPage() {
  return (
    <div className="font-body">
      {/* Page Hero */}
      <div className="border-b border-[var(--hairline)]/60 py-10 sm:py-12">
        <Section>
          <h1 className="font-display text-4xl/tight sm:text-5xl/tight font-semibold tracking-tight text-brand-red">
            About COTTO
          </h1>
        </Section>
      </div>

      {/* Why you&apos;ll double dip */}
      <Section className="py-8 sm:py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-red mb-6">
          Why you&apos;ll double dip
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-lg font-semibold text-brand-red mb-2">Clean ingredients</h3>
            <p className="text-sm leading-6 text-brand-red/80">
              No natural flavors, no gums; just a short list of ingredients you can recognize.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-lg font-semibold text-brand-red mb-2">Protein packed</h3>
            <p className="text-sm leading-6 text-brand-red/80">
              Built on cottage cheese, packed with protein.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-lg font-semibold text-brand-red mb-2">Elevated flavors</h3>
            <p className="text-sm leading-6 text-brand-red/80">
              Familiar flavors with a modern twist.
            </p>
          </div>
        </div>
      </Section>

      {/* Founder Note */}
      <Section className="py-8 sm:py-12">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <h3 className="font-display text-xl font-semibold tracking-tight text-brand-red mb-4">Founder Note</h3>
          <div className="space-y-3 text-brand-red/80 leading-7">
            <p>
              Hi, I&apos;m Kendall. COTTO was born from my own health journey. After facing health challenges that restricted what I could eat, I found myself craving delicious, protein-rich foods that actually made me feel good. Traditional cottage cheese was nutritious but lacked the flavor and versatility I wanted.
            </p>
            <p>
              That&apos;s why I created COTTO—elevated cottage cheese dips that are both delicious and nourishing. Every flavor is crafted with clean ingredients you can recognize, built on the protein foundation of cottage cheese, and designed to make healthy eating feel effortless and enjoyable.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}


