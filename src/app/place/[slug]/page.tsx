import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import Breadcrumbs from "@/components/Breadcrumbs";

type Params = { slug: string };

type Category = { label?: string };
type Neighborhood = { name?: string };
type Place = {
  id: string;
  slug: string;
  name: string;
  address?: string | null;
  website?: string | null;
  rating?: number | null;
  review_count?: number | null;
  price_level?: number | null;
  categories?: Category | Category[] | null;
  neighborhoods?: Neighborhood | Neighborhood[] | null;
};

function euros(level: number | null | undefined) {
  if (!level || level < 1) return "";
  return "€".repeat(Math.min(4, Math.max(1, Math.floor(level))));
}

// Optional: generate page-specific metadata (uses one quick query)
export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const sb = createAdminSupabaseClient();
  const { data: place } = await sb
    .from("places")
    .select("name, neighborhoods ( name )")
    .eq("slug", slug)
    .maybeSingle<Place>();

  if (!place) return { title: "Place not found" };
  const hood =
    Array.isArray(place.neighborhoods) ? place.neighborhoods[0]?.name : place.neighborhoods?.name;

  const title = hood ? `${place.name} · ${hood}` : place.name;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";
  const url = `${base}/place/${slug}`;

  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { title },
  };
}

export default async function PlacePage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const sb = createAdminSupabaseClient();

  const { data: place } = await sb
    .from("places")
    .select(
      `
      id, slug, name, address, website, rating, review_count, price_level,
      categories ( label ),
      neighborhoods ( name )
    `
    )
    .eq("slug", slug)
    .maybeSingle<Place>();

  if (!place) notFound();

  const categoryLabel = Array.isArray(place.categories)
    ? place.categories[0]?.label
    : place.categories?.label;
  const neighborhoodName = Array.isArray(place.neighborhoods)
    ? place.neighborhoods[0]?.name
    : place.neighborhoods?.name;

  const { data: photos } = await sb
    .from("place_photos")
    .select("url, alt, sort_order")
    .eq("place_id", place.id)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        items={[
          { label: "Amsterdam", href: "/" },
          categoryLabel ? { label: categoryLabel, href: `/amsterdam/${(categoryLabel || "").toLowerCase()}` } : { label: "Places", href: "/" },
          { label: place.name },
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{place.name}</h1>

        <div className="text-sm text-muted-foreground">
          {categoryLabel ? <span>{categoryLabel}</span> : null}
          {neighborhoodName ? <span>{categoryLabel ? " · " : ""}{neighborhoodName}</span> : null}
        </div>

        <div className="text-sm">
          {typeof place.rating === "number" ? (
            <>
              ⭐ {place.rating.toFixed(1)}
              {typeof place.review_count === "number" ? ` (${place.review_count})` : ""} ·{" "}
            </>
          ) : null}
          {euros(place.price_level)}
        </div>

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
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="h-10" />
    </main>
  );
}
