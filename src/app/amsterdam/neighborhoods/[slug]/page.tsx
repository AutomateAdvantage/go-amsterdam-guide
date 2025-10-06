// src/app/amsterdam/neighborhoods/[slug]/page.tsx
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PlaceCard } from "@/components/PlaceCard";

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> };

export default async function NeighborhoodPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(sp?.page ?? 1));
  const pageSize = 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const sb = createAdminSupabaseClient();

  const { data: hood } = await sb
    .from("neighborhoods")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!hood) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-bold">Neighborhood not found</h1>
        <p className="mt-2">We couldn’t find “{slug}”.</p>
      </main>
    );
  }

  const { data: places, count } = await sb
    .from("places")
    .select("slug,name,photo_url,rating,review_count,price_level,neighborhoods(name)", { count: "exact" })
    .eq("neighborhood_id", hood.id)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false, nullsFirst: false })
    .range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Best of {hood.name}</h1>
      <p className="mt-2 text-neutral-600">Top-rated places around {hood.name}.</p>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(places ?? []).map((p) => (
          <PlaceCard
            key={p.slug}
            slug={p.slug}
            name={p.name}
            photo_url={(p as any).photo_url}
            rating={(p as any).rating}
            review_count={(p as any).review_count}
            price_level={(p as any).price_level}
            neighborhood_name={(p as any).neighborhoods?.name ?? null}
          />
        ))}
      </section>

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center gap-2">
          <a href={`?page=${Math.max(1, page - 1)}`} className={`rounded border px-3 py-1 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-neutral-50"}`}>Prev</a>
          <span className="text-sm text-neutral-600">Page {page} of {totalPages}</span>
          <a href={`?page=${Math.min(totalPages, page + 1)}`} className={`rounded border px-3 py-1 ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-neutral-50"}`}>Next</a>
        </nav>
      )}
    </main>
  );
}
