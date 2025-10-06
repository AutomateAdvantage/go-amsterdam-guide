import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import Breadcrumbs from "@/components/Breadcrumbs";

type Params = { category: string };

export default async function CategoryPage(props: { params: Promise<Params> }) {
  // ✅ Next 15 dynamic params are async
  const { category } = await props.params;

  const sb = createAdminSupabaseClient();

  // Get category object
  const { data: cat } = await sb
    .from("categories")
    .select("id, label, slug")
    .eq("slug", category)
    .maybeSingle();

  if (!cat) notFound();

  // Fetch places in this category (latest updated first)
  const { data: places } = await sb
    .from("places")
    .select("slug, name, rating, review_count, price_level, neighborhoods ( name )")
    .eq("category_id", cat.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        items={[
          { label: "Amsterdam", href: "/" },
          { label: cat.label },
        ]}
      />

      <h1 className="text-3xl font-bold">{cat.label} in Amsterdam</h1>
      <p className="mt-2 text-muted-foreground">
        Top {cat.label.toLowerCase()} — curated.
      </p>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {(places ?? []).map((p) => {
          const hoodName = Array.isArray(p.neighborhoods)
            ? p.neighborhoods[0]?.name
            : p.neighborhoods?.name;
        return (
          <Link
            key={p.slug}
            href={`/place/${p.slug}`}
            className="block rounded-2xl border p-4 hover:shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {hoodName ? `${hoodName} · ` : ""}
                  {typeof p.rating === "number" ? `⭐ ${p.rating.toFixed(1)}` : ""}
                  {typeof p.review_count === "number" ? ` (${p.review_count})` : ""}
                </p>
              </div>
              {typeof p.price_level === "number" && p.price_level > 0 ? (
                <span className="rounded-full bg-black/5 px-2 py-1 text-xs">
                  {"€".repeat(Math.min(4, Math.max(1, Math.floor(p.price_level))))}
                </span>
              ) : null}
            </div>
          </Link>
        )})}
      </section>
    </main>
  );
}
