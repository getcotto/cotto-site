import dynamic from "next/dynamic";
const KlaviyoForm = dynamic(() => import("@/components/KlaviyoForm"), { ssr: false });

export default function HomePage() {
  return (
    <main className="px-6 sm:px-10 max-w-5xl mx-auto">
      <section className="py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold">About COTTO</h2>
        <p className="mt-4 max-w-3xl">
          We’re bringing elevated, protein-forward cottage cheese dips to your
          favorite flavors—made to share, with clean ingredients and zero fuss.
        </p>

        {/* Email-only waitlist form (Klaviyo) */}
        <div className="mt-8 max-w-md">
          <h3 className="text-xl font-semibold">Join the COTTO waitlist</h3>
          <p className="mt-2">Be the first to know when &amp; where you can try our elevated, protein-packed dips.</p>
          <KlaviyoForm />
        </div>
      </section>
    </main>
  );
}
