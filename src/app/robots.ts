// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  return {
    rules: [
      // Good bots: allow everything except admin/API/internal
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/_next",       // Next.js internals
          "/assets",      // if you add private assets later
          "/private",     // future-proof
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""), // e.g. go-amsterdam-guide.vercel.app
  };
}
