"use client";
import Section from "@/components/Section";

export default function AboutPage() {
  return (
    <div className="font-body">
      {/* Page Hero */}
      <div className="border-b border-[var(--hairline)]/60 py-14 sm:py-16">
        <Section>
          <h1 className="font-display text-4xl/tight sm:text-5xl/tight font-semibold tracking-tight text-neutral-900">
            About COTTO
          </h1>
        </Section>
      </div>

      {/* What makes COTTO special */}
      <Section className="py-10 sm:py-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-900 mb-8">
          What makes COTTO special
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">Clean ingredients</h3>
            <p className="text-sm leading-6 text-neutral-700">
              No natural flavors, no gums; just a short list of ingredients you can recognize.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">Protein forward</h3>
            <p className="text-sm leading-6 text-neutral-700">
              Built on cottage cheese, packed with protein.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">Elevated flavors</h3>
            <p className="text-sm leading-6 text-neutral-700">
              Familiar flavors with a modern twist.
            </p>
          </div>
        </div>
      </Section>

      {/* How to enjoy */}
      <Section className="py-2 sm:py-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-900 mb-6">How to enjoy</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            Dipping veggies/chips
          </div>
          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            Topping a Buddha bowl
          </div>
          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            Spreading on toast
          </div>
          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            Adding a scoop to a salad
          </div>
          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            Using as a high-protein swap for mayo or sour cream
          </div>
        </div>
      </Section>

      {/* Founder Note */}
      <Section className="py-12 sm:py-16">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <h3 className="font-display text-xl font-semibold tracking-tight text-neutral-900 mb-6">Founder Note</h3>
          <div className="space-y-4 text-neutral-700 leading-7">
            <p>
              Hi, I'm Kendall. COTTO was born from my own health journey. After facing health challenges that restricted what I could eat, I found myself craving delicious, protein-rich foods that actually made me feel good. Traditional cottage cheese was nutritious but lacked the flavor and versatility I wanted.
            </p>
            <p>
              That's why I created COTTO—elevated cottage cheese dips that are both delicious and nourishing. Every flavor is crafted with clean ingredients you can recognize, built on the protein foundation of cottage cheese, and designed to make healthy eating feel effortless and enjoyable.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}


