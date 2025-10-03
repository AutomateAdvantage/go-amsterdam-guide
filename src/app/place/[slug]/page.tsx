import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function PlacePage({ params }: Props) {
  const { slug } = await params; // Next 15: params is a Promise
  const sb = createAdminSupabaseClient();

  // Include raw foreign keys so we always have a fallback
  const { data: place } = await sb
    .from("places")
    .select(
      `
      id, name, slug, address, website, price_level, rating, review_count,
      category_id, neighborhood_id,
      categories:category_id(label),
      neighborhoods:neighborhood_id(name)
    `
    )
    .eq("slug", slug)
    .single();

  if (!place) notFound();

  // Handle both array and object shapes for joined relations
  const categoryLabel = Array.isArray(place.categories)
    ? place.categories[0]?.label
    : place.categories?.label;

  const neighborhoodName = Array.isArray(place.neighborhoods)
    ? place.neighborhoods[0]?.name
    : place.neighborhoods?.name;

  const { data: photos } = await sb
    .from("place_photos")
    .select("id,url,alt,position")
    .eq("place_id", place.id)
    .order("position", { ascending: true });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{place.name}</h1>
        <div className="text-sm text-muted-foreground">
          {categoryLabel ?? "Place"} {neighborhoodName ? `· ${neighborhoodName}` : ""}
        </div>
        <div className="mt-2 text-sm">
          {place.rating ? (
            <>
              ⭐ {place.rating} ({place.review_count ?? 0}) ·{" "}
            </>
          ) : null}
          {place.price_level ? (
            <>€{"€".repeat(Math.max(0, place.price_level - 1))} · </>
          ) : null}
          {place.address}
        </div>
        {place.website ? (
          <div className="mt-2">
            <a className="underline" href={place.website} target="_blank" rel="noreferrer">
              Website
            </a>
          </div>
        ) : null}
      </div>

      {photos?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
          {/* Using <img> is fine; Next warns to consider <Image/> for perf */}
          {photos.map((ph) => (
            <img
              key={ph.id}
              src={ph.url}
              alt={ph.alt ?? ""}
              className="w-full h-48 object-cover rounded-xl border"
            />
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border p-4">
        <div className="font-semibold mb-2">About</div>
        <p className="text-sm text-muted-foreground">
          Detailed summary, highlights, and tips will go here.
        </p>
      </div>
    </main>
  );
}
