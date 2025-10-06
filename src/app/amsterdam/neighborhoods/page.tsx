// src/app/amsterdam/neighborhoods/page.tsx
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function NeighborhoodsIndex() {
  const sb = createAdminSupabaseClient();
  const { data: hoods } = await sb
    .from("neighborhoods")
    .select("name,slug")
    .order("name");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Amsterdam Neighborhoods</h1>
      <p className="mt-2 text-neutral-600">Explore the best spots by area.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {(hoods ?? []).map((n) => (
          <a key={n.slug} href={`/amsterdam/neighborhoods/${n.slug}`} className="rounded-2xl border p-4 hover:shadow">
            <div className="font-medium">{n.name}</div>
            <div className="text-sm text-neutral-600">Best spots in {n.name}</div>
          </a>
        ))}
      </div>
    </main>
  );
}
