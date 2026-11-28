import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaManager } from "@/components/pwa/PwaManager";

export const metadata: Metadata = {
  title: "Delhi Explorer – Interactive Geospatial Map & AI Guide",
  description:
    "Explore Delhi with interactive layers, landmark discoveries, GPS geolocation, routing, live weather, and AI Copilot guide.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/brand/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Delhi Explorer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/brand/icon-192.png" />
        <link
          rel="preload"
          as="image"
          href="/brand/delhi-basemap.webp"
          type="image/webp"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://a.tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://b.tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://c.tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
        <link rel="dns-prefetch" href="https://router.project-osrm.org" />
      </head>
      <body className="antialiased select-none overflow-hidden">
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
