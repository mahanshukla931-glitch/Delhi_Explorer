import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Call Nominatim with User-Agent adhering to OSM free policy
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q.trim()
    )}&format=json&addressdetails=1&limit=8&countrycodes=in`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "DelhiExplorerMapApp/1.0 (contact: info@delhiexplorer.local)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache responses for 1 hour to prevent rate limiting
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();

    interface NominatimItem {
      place_id: number;
      name?: string;
      display_name: string;
      class?: string;
      type?: string;
      lat: string;
      lon: string;
      importance?: number;
      address?: Record<string, string>;
    }

    const formatted = data.map((item: NominatimItem) => ({
      id: String(item.place_id),
      name: item.name || item.display_name.split(",")[0],
      displayName: item.display_name,
      category: item.type || item.class || "location",
      coordinates: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
      type: item.type,
      importance: item.importance,
      address: item.address,
    }));

    return NextResponse.json({ results: formatted });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to search location" },
      { status: 500 }
    );
  }
}
