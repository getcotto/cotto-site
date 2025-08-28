"use client";
import Section from "@/components/Section";
import FeatureCard from "@/components/FeatureCard";
import PillCard from "@/components/PillCard";
import { Leaf, Dumbbell, Sparkles, Salad, Soup, Sandwich } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="font-body">
      {/* Page Hero */}
      <div className="border-b border-[var(--hairline)]/60 py-14 sm:py-16">
        <Section>
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">About</p>
          <h1 className="mt-3 font-display text-4xl/tight sm:text-5xl/tight font-semibold tracking-tight text-neutral-900">
            What makes <span className="italic">COTTO</span> special
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
            Clean ingredients you can recognize, built on cottage cheese for meaningful protein, and flavor profiles that feel classic—refined with a modern twist.
          </p>
        </Section>
      </div>

      {/* Features */}
      <Section className="py-10 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={<Leaf size={18} />} title="Clean ingredients">
            No natural flavors, no gums; just a short list of ingredients you can recognize.
          </FeatureCard>
          <FeatureCard icon={<Dumbbell size={18} />} title="Protein forward">
            Built on cottage cheese, packed with protein.
          </FeatureCard>
          <FeatureCard icon={<Sparkles size={18} />} title="Elevated flavors">
            Familiar flavors with a modern twist.
          </FeatureCard>
        </div>
      </Section>

      {/* How to enjoy */}
      <Section className="py-2 sm:py-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-900">How to enjoy</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PillCard icon={<Salad size={16} />}>Dipping veggies/chips</PillCard>
          <PillCard icon={<Soup size={16} />}>Topping a Buddha bowl</PillCard>
          <PillCard icon={<Sandwich size={16} />}>Spreading on toast</PillCard>
          <PillCard icon={<Salad size={16} />}>Adding a scoop to a salad</PillCard>
          <PillCard icon={<Soup size={16} />}>High-protein swap for mayo or sour cream</PillCard>
        </div>
      </Section>

      {/* Founder Note */}
      <Section className="py-12 sm:py-16">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="grid gap-6 lg:grid-cols-[8px_1fr]">
            <div className="hidden rounded-full bg-neutral-900/80 lg:block" />
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight text-neutral-900">Founder note</h3>
              <p className="mt-3 text-neutral-700 leading-7">
                I'm Kendall. After health challenges that restricted what I could eat, I was searching for foods that tasted great and also made me feel good. Traditional cottage cheese was nutritious but didn't deliver on flavor or versatility.
              </p>
              <p className="mt-4 text-neutral-700 leading-7">
                COTTO is my answer—elevated cottage cheese dips crafted with clean ingredients you can recognize, built on a protein-forward base, and designed to make healthy eating feel effortless and enjoyable.
              </p>
              <p className="mt-6 text-sm text-neutral-600">— Kendall, Founder</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Soft CTA */}
      <Section className="pb-16">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 text-center shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <h4 className="font-display text-xl font-semibold tracking-tight text-neutral-900">Be first to try COTTO</h4>
          <p className="mt-2 text-neutral-700">Join the waitlist and follow our journey to launch.</p>
          <a href="/#waitlist" className="mt-5 inline-flex items-center justify-center rounded-full bg-[#971B1E] px-5 py-3 text-sm font-medium text-white hover:opacity-95">
            Join the waitlist
          </a>
        </div>
      </Section>
    </div>
  );
}


