import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Ensure Node runtime (Papa + File.text() work fine here)
export const runtime = "nodejs";

type RawRow = Record<string, unknown>;
type CleanRow = {
  slug: string;
  name: string;
  address: string | null;
  website: string | null;
  price_level: number | null;
  rating: number | null;
  review_count: number;
  category_slug: string;
  neighborhood_slug: string | null;
  // resolved ids
  category_id?: string;
  neighborhood_id?: string | null;
};

function normSlug(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normText(s: unknown): string | null {
  const v = String(s ?? "").trim();
  return v ? v : null;
}

function normWebsite(s: unknown): string | null {
  const raw = String(s ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.toString();
  } catch {
    return null;
  }
}

function normInt(n: unknown): number | null {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : null;
}
function normIntDefault(n: unknown, d = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : d;
}
function normPriceLevel(n: unknown): number | null {
  const v = Number(n);
  return Number.isFinite(v) && v >= 1 && v <= 4 ? Math.round(v) : null;
}
function normRating(n: unknown): number | null {
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 && v <= 5 ? Number(v) : null;
}

// Normalize headers -> snake_case keys we expect
function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, "_").replace(/-+/g, "_");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const csvText = await file.text();

    // Parse CSV
    const parseResult = await new Promise<Papa.ParseResult<RawRow>>((resolve) => {
      Papa.parse<RawRow>(csvText, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: normalizeHeader,
        complete: resolve,
      });
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      return NextResponse.json(
        { message: "CSV parse error", details: parseResult.errors[0].message },
        { status: 400 }
      );
    }

    const rows = parseResult.data;

    if (!rows.length) {
      return NextResponse.json({ message: "CSV contained no rows" }, { status: 400 });
    }

    // Basic cleaning + validation
    const cleaned: CleanRow[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const name = normText(r["name"]);
      const slug = normSlug(r["slug"] ?? name);
      const category_slug = normSlug(r["category_slug"]);
      if (!name) {
        errors.push({ row: i + 2, error: "Missing name" });
        continue;
      }
      if (!slug) {
        errors.push({ row: i + 2, error: "Missing slug (or could not generate from name)" });
        continue;
      }
      if (!category_slug) {
        errors.push({ row: i + 2, error: "Missing category_slug" });
        continue;
      }

      cleaned.push({
        name,
        slug,
        category_slug,
        address: normText(r["address"]),
        website: normWebsite(r["website"]),
        price_level: normPriceLevel(r["price_level"]),
        rating: normRating(r["rating"]),
        review_count: normIntDefault(r["review_count"], 0),
        neighborhood_slug: normSlug(r["neighborhood_slug"]) || null,
      });
    }

    if (!cleaned.length) {
      return NextResponse.json(
        { message: "No valid rows after validation", errors },
        { status: 400 }
      );
    }

    const sb = createAdminSupabaseClient();

    // Resolve category_id & neighborhood_id via slug lookups
    const uniqueCategorySlugs = [...new Set(cleaned.map((c) => c.category_slug))];
    const uniqueHoodSlugs = [
      ...new Set(cleaned.map((c) => c.neighborhood_slug).filter(Boolean) as string[]),
    ];

    const [{ data: cats, error: catErr }, { data: hoods, error: hoodErr }] = await Promise.all([
      sb.from("categories").select("id,slug").in("slug", uniqueCategorySlugs),
      uniqueHoodSlugs.length
        ? sb.from("neighborhoods").select("id,slug").in("slug", uniqueHoodSlugs)
        : Promise.resolve({ data: [] as { id: string; slug: string }[], error: null }),
    ]);

    if (catErr || hoodErr) {
      return NextResponse.json(
        { message: "Lookup failed", details: catErr ?? hoodErr },
        { status: 500 }
      );
    }

    const catMap = new Map((cats ?? []).map((c) => [c.slug, c.id]));
    const hoodMap = new Map((hoods ?? []).map((n) => [n.slug, n.id]));

    const finalRows = cleaned.filter((c, idx) => {
      const catId = catMap.get(c.category_slug);
      if (!catId) {
        errors.push({ row: idx + 2, error: `Unknown category_slug: ${c.category_slug}` });
        return false;
      }
      c.category_id = catId;
      c.neighborhood_id = c.neighborhood_slug ? hoodMap.get(c.neighborhood_slug) ?? null : null;
      return true;
    });

    if (!finalRows.length) {
      return NextResponse.json(
        { message: "All rows were skipped due to invalid category/neighborhood slugs", errors },
        { status: 400 }
      );
    }

    // Upsert directly into places (safe because we use the admin client + server route)
    const { error: upsertErr, count } = await sb
      .from("places")
      .upsert(
        finalRows.map((r) => ({
          slug: r.slug,
          name: r.name,
          address: r.address,
          website: r.website,
          price_level: r.price_level,
          rating: r.rating,
          review_count: r.review_count,
          category_id: r.category_id!,
          neighborhood_id: r.neighborhood_id ?? null,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "slug", ignoreDuplicates: false, count: "exact" }
      );

    if (upsertErr) {
      return NextResponse.json({ message: "Upsert failed", details: upsertErr }, { status: 500 });
    }

    return NextResponse.json({
      message: `Import complete`,
      insertedOrUpdated: count ?? finalRows.length,
      skipped: errors.length,
      errors,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Server error" }, { status: 500 });
  }
}