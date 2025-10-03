import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function PlacePage({ params }: Props) {
  const { slug } = await params; // <-- await params
  const sb = createAdminSupabaseClient();

  const { data: place } = await sb
    .from("places")
    .select(`
      id, name, slug, address, website, price_level, rating, review_count,
      categories:category_id(label),
      neighborhoods:neighborhood_id(name)
    `)
    .eq("slug", slug)
    .single();

  if (!place) notFound();

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
          {place.categories?.label} {place.neighborhoods?.name ? `· ${place.neighborhoods?.name}` : ""}
        </div>
        <div className="mt-2 text-sm">
          {place.rating ? <>⭐ {place.rating} ({place.review_count ?? 0}) · </> : null}
          {place.price_level ? <>€{"€".repeat(Math.max(0, place.price_level - 1))} · </> : null}
          {place.address}
        </div>
        {place.website ? (
          <div className="mt-2">
            <a className="underline" href={place.website} target="_blank">Website</a>
          </div>
        ) : null}
      </div>

      {photos?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
          {photos.map((ph) => (
            <img key={ph.id} src={ph.url} alt={ph.alt ?? ""} className="w-full h-48 object-cover rounded-xl border" />
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
