import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const sb = createAdminSupabaseClient();

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/amsterdam/restaurants`, lastModified: new Date() },
    { url: `${base}/amsterdam/cafes`, lastModified: new Date() },
    { url: `${base}/amsterdam/bars`, lastModified: new Date() },
    { url: `${base}/amsterdam/hotels`, lastModified: new Date() },
    { url: `${base}/amsterdam/museums`, lastModified: new Date() },
    { url: `${base}/amsterdam/attractions`, lastModified: new Date() },
    { url: `${base}/amsterdam/parks`, lastModified: new Date() },
    { url: `${base}/amsterdam/neighborhoods`, lastModified: new Date() },
  ];

  const { data: places } = await sb
    .from("places")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false })
    .limit(2000);

  if (places) {
    urls.push(
      ...places.map((p) => ({
        url: `${base}/place/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      }))
    );
  }

  return urls;
}
