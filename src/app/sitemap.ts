// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const sb = createAdminSupabaseClient();

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/amsterdam/neighborhoods`, lastModified: new Date() },
  ];

  // Fetch dynamic sections
  const [{ data: categories }, { data: hoods }] = await Promise.all([
    sb.from("categories").select("slug,label").order("label"),
    sb.from("neighborhoods").select("slug,name").order("name"),
  ]);

  if (categories?.length) {
    urls.push(
      ...categories.map((c) => ({
        url: `${base}/amsterdam/${c.slug}`,
        lastModified: new Date(),
      }))
    );
  }

  if (hoods?.length) {
    urls.push(
      ...hoods.map((n) => ({
        url: `${base}/amsterdam/neighborhoods/${n.slug}`,
        lastModified: new Date(),
      }))
    );
  }

  // Places — select both timestamps so we can safely fallback
  const { data: places } = await sb
    .from("places")
    .select("slug, updated_at, created_at")
    .limit(5000); // raise if you want; Google handles up to 50k entries per sitemap

  if (places?.length) {
    // Sort newest first using updated_at → created_at fallback
    const sorted = [...places].sort((a, b) => {
      const ad = new Date(a.updated_at ?? a.created_at ?? Date.now()).getTime();
      const bd = new Date(b.updated_at ?? b.created_at ?? Date.now()).getTime();
      return bd - ad;
    });

    urls.push(
      ...sorted.map((p) => ({
        url: `${base}/place/${p.slug}`,
        lastModified: new Date(p.updated_at ?? p.created_at ?? Date.now()),
      }))
    );
  }

  return urls;
}
