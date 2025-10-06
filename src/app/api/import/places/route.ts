import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Row = {
  name?: string;
  slug?: string;
  address?: string;
  website?: string;
  price_level?: string | number;
  rating?: string | number;
  review_count?: string | number;
  category_slug?: string;
  neighborhood_slug?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const sb = createAdminSupabaseClient();

    // Collect needed slugs
    const categorySlugs = Array.from(new Set(rows.map(r => r.category_slug).filter(Boolean))) as string[];
    const hoodSlugs = Array.from(new Set(rows.map(r => r.neighborhood_slug).filter(Boolean))) as string[];

    // Fetch IDs
    const [{ data: cats, error: catErr }, { data: hoods, error: hoodErr }] = await Promise.all([
      sb.from("categories").select("id,slug").in("slug", categorySlugs),
      hoodSlugs.length ? sb.from("neighborhoods").select("id,slug").in("slug", hoodSlugs) : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (catErr) throw catErr;
    if (hoodErr) throw hoodErr;

    const catMap = new Map<string, string>((cats ?? []).map(c => [c.slug, c.id]));
    const hoodMap = new Map<string, string>((hoods ?? []).map(n => [n.slug, n.id]));

    // Build payload for upsert
    const payload = rows
      .map((r) => {
        const category_id = r.category_slug ? catMap.get(r.category_slug) : undefined;
        if (!r.slug || !r.name || !category_id) {
          return null; // skip invalid rows
        }
        const neighborhood_id = r.neighborhood_slug ? hoodMap.get(r.neighborhood_slug) : null;

        const price_level = r.price_level === "" || r.price_level == null ? null : Number(r.price_level);
        const rating = r.rating === "" || r.rating == null ? null : Number(r.rating);
        const review_count = r.review_count === "" || r.review_count == null ? null : Number(r.review_count);

        return {
          slug: r.slug,
          name: r.name,
          address: r.address ?? null,
          website: r.website ?? null,
          price_level,
          rating,
          review_count,
          category_id,
          neighborhood_id,
        };
      })
      .filter(Boolean) as any[];

    if (!payload.length) {
      return NextResponse.json({ error: "No valid rows after validation" }, { status: 400 });
    }

    // Upsert by slug
    const { data, error } = await sb
      .from("places")
      .upsert(payload, { onConflict: "slug" })
      .select("slug");

    if (error) throw error;

    // Rough counts
    const inserted = data?.length ?? 0;
    // (supabase doesn't separate updated vs inserted in return; you can refine if needed)
    const result = { inserted, updated: 0, errors: [] as string[] };

    return NextResponse.json(result);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Import failed" }, { status: 500 });
  }
}
