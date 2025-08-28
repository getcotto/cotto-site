export default function AboutPage() {
  return (
    <main className="px-6 sm:px-10 max-w-5xl mx-auto py-12 sm:py-16">
      <h1 className="text-3xl font-semibold">About COTTO</h1>
      
      {/* Product Overview */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">What makes COTTO special</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Clean ingredients</h3>
            <p className="text-black/70">
              No natural flavors, no gums; just a short list of ingredients you can recognize.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Protein forward</h3>
            <p className="text-black/70">
              Built on cottage cheese, packed with protein.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Elevated flavors</h3>
            <p className="text-black/70">
              Familiar flavors with a modern twist.
            </p>
          </div>
        </div>
      </section>

      {/* How to Enjoy */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-6">How to enjoy</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-black/70">Dipping veggies/chips</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-black/70">Topping a Buddha bowl</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-black/70">Spreading on toast</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-black/70">Adding a scoop to a salad</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-black/70">Using as a high-protein swap for mayo or sour cream</p>
          </div>
        </div>
      </section>

      {/* Founder Note */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-6">Founder Note</h2>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-black/70 leading-relaxed">
            Hi, I'm Kendall. COTTO was born from my own health journey. After facing health challenges 
            that restricted what I could eat, I found myself craving delicious, protein-rich foods that 
            actually made me feel good. Traditional cottage cheese was nutritious but lacked the flavor 
            and versatility I wanted.
          </p>
          <p className="text-black/70 leading-relaxed mt-4">
            That's why I created COTTO—elevated cottage cheese dips that are both delicious and 
            nourishing. Every flavor is crafted with clean ingredients you can recognize, built on 
            the protein foundation of cottage cheese, and designed to make healthy eating feel 
            effortless and enjoyable.
          </p>
          <p className="text-black/70 leading-relaxed mt-4">
            My hope is that COTTO helps others discover that healthy food can be both satisfying 
            and truly delicious.
          </p>
        </div>
      </section>
    </main>
  );
}


