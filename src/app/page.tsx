export default function Home() {
  const categories = [
    { slug: "restaurants", label: "Restaurants" },
    { slug: "cafes", label: "Cafés" },
    { slug: "bars", label: "Bars" },
    { slug: "hotels", label: "Hotels" },
    { slug: "museums", label: "Museums" },
    { slug: "attractions", label: "Attractions" },
    { slug: "parks", label: "Parks" },
    { slug: "neighborhoods", label: "Neighborhoods" },
  ];

  const neighborhoods = [
    "De Pijp",
    "Jordaan",
    "Oud-West",
    "Centrum",
    "Oost",
    "Zuid",
    "Noord",
    "Zuidoost",
  ];

  return (
    <main className="min-h-dvh">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">Go Amsterdam Guide</h1>
        <p className="mt-2 text-muted-foreground">
          Curated places, neighborhoods, and experiences in Amsterdam — fast,
          clean, and SEO-friendly.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="text-2xl font-semibold mb-4">Explore by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`/amsterdam/${c.slug}`}
              className="block rounded-2xl border p-4 hover:shadow"
            >
              <div className="text-lg font-medium">{c.label}</div>
              <div className="text-sm text-muted-foreground">Top picks & maps</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-semibold mb-4">Explore by neighborhood</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {neighborhoods.map((n) => (
            <a
              key={n}
              href={`/amsterdam/neighborhoods/${n.toLowerCase().replaceAll(" ", "-")}`}
              className="block rounded-2xl border p-4 hover:shadow"
            >
              <div className="text-lg font-medium">{n}</div>
              <div className="text-sm text-muted-foreground">Best spots in {n}</div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
