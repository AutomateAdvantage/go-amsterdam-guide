import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const sb = createAdminSupabaseClient();

    // OPTIONAL admin secret check — uncomment if you want to lock it down now
    // const auth = req.headers.get("x-admin-secret");
    // if (process.env.ADMIN_SECRET && auth !== process.env.ADMIN_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const placeSlug = String(form.get("place_slug") || "");
    const alt = String(form.get("alt") || "");

    if (!file || !placeSlug) {
      return NextResponse.json({ error: "file and place_slug required" }, { status: 400 });
    }

    // Lookup place by slug to get id
    const { data: place, error: pErr } = await sb
      .from("places")
      .select("id, slug")
      .eq("slug", placeSlug)
      .single();
    if (pErr || !place) throw pErr || new Error("Place not found");

    // Create a unique storage path: place-slug/timestamp-filename
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${placeSlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uErr } = await sb.storage
      .from("place-photos")
      .upload(path, Buffer.from(arrayBuffer), {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (uErr) throw uErr;

    // Get public URL
    const { data: pub } = sb.storage.from("place-photos").getPublicUrl(path);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) throw new Error("Failed to get public URL");

    // Insert DB row
    const { error: iErr } = await sb.from("place_photos").insert({
      place_id: place.id,
      url: publicUrl,
      alt,
      sort_order: 0,
    });
    if (iErr) throw iErr;

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "upload failed" }, { status: 500 });
  }
}
