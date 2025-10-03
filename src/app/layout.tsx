import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Go Amsterdam Guide",
  description:
    "Curated directory for Amsterdam restaurants, cafés, hotels, museums, and more.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
