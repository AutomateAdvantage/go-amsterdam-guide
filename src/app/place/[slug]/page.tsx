// src/app/place/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Params = { slug: string };

// Small helpers
function euros(level: number | null | undefined) {
  if (!level || level < 1) return "";
  return "€".repeat(Math.min(4, Math.max(1, Math.floor(level))));
}

export default async function PlacePage(props: { params: Promise<Params> }) {
  // ✅ Next.js 15 dynamic params can be async:
  const { slug } = await props.params;

  const sb = createAdminSupabaseClient();

  // 1) Fetch the place (join label/name from related tables)
  const { data: place, error: placeErr } = await sb
    .from("places")
    .select(
      `
      id, slug, name, address, website, rating, review_count, price_level,
      categories ( label ),
      neighborhoods ( name )
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (placeErr) {
    console.error(placeErr);
  }
  if (!place) {
    notFound();
  }

  // Normalize possible array/object shapes from Supabase joins
  const categoryLabel =
    Array.isArray(place.categories)
      ? place.categories[0]?.label
      : place.categories?.label;

  const neighborhoodName =
    Array.isArray(place.neighborhoods)
      ? place.neighborhoods[0]?.name
      : place.neighborhoods?.name;

  // 2) Fetch photos for this place
  const { data: photos, error: photoErr } = await sb
    .from("place_photos")
    .select("url, alt, sort_order")
    .eq("place_id", place.id)
    .order("sort_order", { ascending: true });

  if (photoErr) {
    console.error(photoErr);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{place.name}</h1>

        <div className="text-sm text-muted-foreground">
          {/* Meta line: category • neighborhood */}
          {categoryLabel ? <span>{categoryLabel}</span> : null}
          {neighborhoodName ? (
            <span>{categoryLabel ? " · " : ""}{neighborhoodName}</span>
          ) : null}
        </div>

        <div className="text-sm">
          {/* Rating / reviews / price */}
          {typeof place.rating === "number" ? (
            <>
              ⭐ {place.rating.toFixed(1)}{" "}
              {typeof place.review_count === "number"
                ? `(${place.review_count})`
                : null}
              {" · "}
            </>
          ) : null}
          {euros(place.price_level)}
        </div>

        {/* Address / website */}
        <div className="mt-2 text-sm">
          {place.address ? <div>{place.address}</div> : null}
          {place.website ? (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-2"
            >
              Visit website
            </a>
          ) : null}
        </div>
      </header>

      {/* Photo grid */}
      {photos?.length ? (
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((p) => (
              <div key={p.url} className="relative aspect-square w-full overflow-hidden rounded-xl">
                <Image
                  src={p.url}
                  alt={p.alt || place.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
                  className="object-cover"
                  priority={false}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Spacer */}
      <div className="h-10" />

      {/* (Optional) Map linkouts / more sections can go here */}
    </main>
  );
}
