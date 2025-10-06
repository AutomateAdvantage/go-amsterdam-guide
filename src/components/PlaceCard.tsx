// src/components/PlaceCard.tsx
import Link from "next/link";

type Props = {
  slug: string;
  name: string;
  photo_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  neighborhood_name?: string | null;
  price_level?: number | null; // 1..4, optional
};

export function PlaceCard({
  slug,
  name,
  photo_url,
  rating,
  review_count,
  neighborhood_name,
  price_level,
}: Props) {
  const price = typeof price_level === "number" ? "€".repeat(Math.max(1, Math.min(4, price_level))) : undefined;

  return (
    <Link
      href={`/place/${slug}`}
      className="block overflow-hidden rounded-2xl border hover:shadow transition-shadow"
    >
      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
        {photo_url ? (
          // Using <img> keeps it simple; you can swap to next/image if you prefer.
          <img
            src={photo_url}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-sm text-neutral-400">
            No photo
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium">{name}</div>
        <div className="mt-1 text-sm text-neutral-600 flex flex-wrap gap-x-2">
          {rating ? <>⭐ {rating}{review_count ? <> ({review_count})</> : null}</> : null}
          {rating && (neighborhood_name || price) ? <span>·</span> : null}
          {neighborhood_name ? <>{neighborhood_name}</> : null}
          {neighborhood_name && price ? <span>·</span> : null}
          {price ? <>{price}</> : null}
        </div>
      </div>
    </Link>
  );
}
