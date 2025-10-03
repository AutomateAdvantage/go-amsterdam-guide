import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

type Props = { params: { category: string } };

export default async function CategoryPage({ params }: Props) {
  const sb = createAdminSupabaseClient();
  const slug = params.category;

  // Find the category
  const { data: category } = await sb
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) {
    notFound();
  }

  // Get places in this category
  const { data: places } = await sb
    .from("places")
    .select("id,name,slug,address,price_level,rating,review_count")
    .eq("category_id", category.id)
    .order("rating", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Best {category.label} in Amsterdam</h1>
      <p className="text-muted-foreground mb-6">
        Curated picks, updated regularly.
      </p>

      <div className="grid gap-3">
        {places?.length ? places.map(p => (
          <a key={p.id} href={`/place/${p.slug}`} className="block rounded-xl border p-4 hover:shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              {p.rating ? <span className="text-sm">⭐ {p.rating} ({p.review_count ?? 0})</span> : null}
            </div>
            {p.address ? <div className="text-sm text-muted-foreground">{p.address}</div> : null}
            {p.price_level ? <div className="text-sm mt-1">€{"€".repeat(Math.max(0, p.price_level - 1))}</div> : null}
          </a>
        )) : (
          <div className="text-sm text-muted-foreground">No places yet for this category.</div>
        )}
      </div>
    </main>
  );
}
