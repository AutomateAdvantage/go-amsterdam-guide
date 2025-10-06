import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// SERVER ACTIONS
async function createPlace(formData: FormData) {
  "use server";
  const sb = createAdminSupabaseClient();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const category_id = String(formData.get("category_id") || "");
  const neighborhood_id = String(formData.get("neighborhood_id") || "") || null;
  const address = String(formData.get("address") || "") || null;
  const website = String(formData.get("website") || "") || null;
  const price_level = Number(formData.get("price_level") || 0) || null;

  if (!name || !slug || !category_id) {
    throw new Error("Name, slug, and category are required.");
  }

  const { error } = await sb.from("places").insert({
    name,
    slug,
    category_id,
    neighborhood_id,
    address,
    website,
    price_level
  });

  if (error) throw error;

  // refresh this page so the list includes the new place
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const sb = createAdminSupabaseClient();

  const [{ data: categories }, { data: neighborhoods }, { data: places }] =
    await Promise.all([
      sb.from("categories").select("*").order("label", { ascending: true }),
      sb.from("neighborhoods").select("*").order("name", { ascending: true }),
      sb
        .from("places")
        .select("id,name,slug,category_id,neighborhood_id,address")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Create Place</h2>
        <form action={createPlace} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" className="w-full rounded border px-3 py-2" placeholder="Café de Pijp" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input name="slug" className="w-full rounded border px-3 py-2" placeholder="cafe-de-pijp" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select name="category_id" className="w-full rounded border px-3 py-2" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Neighborhood (optional)</label>
            <select name="neighborhood_id" className="w-full rounded border px-3 py-2" defaultValue="">
              <option value="">None</option>
              {neighborhoods?.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Address</label>
            <input name="address" className="w-full rounded border px-3 py-2" placeholder="Street 1, Amsterdam" />
          </div>
          <div>
            <label className="block text-sm mb-1">Website</label>
            <input name="website" className="w-full rounded border px-3 py-2" placeholder="https://example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Price level (1-4)</label>
            <input name="price_level" type="number" min={1} max={4} className="w-full rounded border px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-lg border px-4 py-2 hover:shadow">Create</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Latest Places</h2>
        <div className="grid gap-2">
          {places?.length ? places.map(p => (
            <div key={p.id} className="rounded-xl border p-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">{p.slug}</div>
              <div className="text-sm">{p.address}</div>
            </div>
          )) : <div className="text-sm text-muted-foreground">No places yet.</div>}
        </div>
      </section>
    </main>
  );
}
<a href="/admin/import" className="inline-block rounded-md border px-3 py-2 hover:bg-gray-50">
  CSV Importer
</a>
