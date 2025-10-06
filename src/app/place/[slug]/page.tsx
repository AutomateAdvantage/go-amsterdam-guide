// src/app/place/[slug]/page.tsx
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ slug: string }> };

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const sb = createAdminSupabaseClient();

  const { data: place } = await sb
    .from("places")
    .select("slug,name,address,website,price_level,rating,review_count,photo_url, categories(label,slug), neighborhoods(name,slug)")
    .eq("slug", slug)
    .maybeSingle();

  if (!place) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold">Place not found</h1>
        <p className="mt-2">We couldn’t find “{slug}”.</p>
      </main>
    );
  }

  const neighborhoodName = (place as any).neighborhoods?.name ?? null;
  const categoryLabel = (place as any).categories?.label ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: place.name,
    address: place.address || undefined,
    url: place.website || undefined,
    image: place.photo_url || undefined,
    aggregateRating:
      place.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: place.rating,
            reviewCount: place.review_count ?? 0,
          }
        : undefined,
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl overflow-hidden bg-neutral-100">
          {place.photo_url ? (
            <img src={place.photo_url} alt={place.name} className="w-full h-auto" />
          ) : (
            <div className="aspect-[4/3] grid place-items-center text-neutral-400">No photo</div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold">{place.name}</h1>
          <div className="text-sm text-neutral-600 mt-1">
            {categoryLabel ? <>{categoryLabel}</> : null}
            {categoryLabel && neighborhoodName ? <span> · </span> : null}
            {neighborhoodName ? <>{neighborhoodName}</> : null}
          </div>

          <div className="mt-2 text-sm">
            {typeof place.rating === "number" ? <>⭐ {place.rating} ({place.review_count ?? 0})</> : null}
          </div>

          {place.address ? <div className="mt-3">{place.address}</div> : null}

          <div className="mt-4 flex gap-2">
            {place.website ? (
              <a href={place.website} target="_blank" rel="noopener noreferrer" className="rounded border px-3 py-2 hover:bg-neutral-50">
                Website
              </a>
            ) : null}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + (place.address ? " " + place.address : " Amsterdam"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border px-3 py-2 hover:bg-neutral-50"
            >
              Open in Maps
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
