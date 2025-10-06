import type { Metadata } from "next";
import "./globals.css";

const siteName = "Go Amsterdam Guide";
const description =
  "Curated places, neighborhoods, and experiences in Amsterdam — fast, clean, and SEO-friendly.";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description,
  openGraph: {
    type: "website",
    url: baseUrl,
    siteName,
    title: siteName,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
