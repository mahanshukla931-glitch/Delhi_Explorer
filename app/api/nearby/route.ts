import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Overpass API category queries
const OVERPASS_CATEGORY_TAGS: Record<string, string> = {
  cafe: 'node["amenity"="cafe"]',
  atm: 'node["amenity"="atm"]',
  hospital: 'node["amenity"="hospital"]',
  restaurant: 'node["amenity"="restaurant"]',
  pharmacy: 'node["amenity"="pharmacy"]',
  bank: 'node["amenity"="bank"]',
  fuel: 'node["amenity"="fuel"]',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = parseInt(searchParams.get("radius") || "1000", 10); // in meters, default 1km
    const category = searchParams.get("category") || "cafe";

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Invalid lat/lng coordinates" }, { status: 400 });
    }

    const queryTag = OVERPASS_CATEGORY_TAGS[category] || OVERPASS_CATEGORY_TAGS.cafe;

    // Overpass QL query: find nodes around [lat, lng] within [radius] meters
    const query = `
      [out:json][timeout:15];
      (
        ${queryTag}(around:${radius},${lat},${lng});
      );
      out body 30;
      >;
      out skel qt;
    `;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(overpassUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DelhiExplorer/1.0",
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Overpass API responded with status ${res.status}`);
    }

    const data = await res.json();

    const elements = (data.elements || [])
      .filter((el: { lat?: number; lon?: number }) => el.lat && el.lon)
      .map((el: { id: number; lat: number; lon: number; tags?: Record<string, string> }) => ({
        id: `op-${el.id}`,
        name: el.tags?.name || `${category.toUpperCase()} (${el.tags?.brand || "Nearby"})`,
        coordinates: [el.lat, el.lon] as [number, number],
        category,
        address: el.tags?.["addr:street"]
          ? `${el.tags?.["addr:street"]}, ${el.tags?.["addr:city"] || "Delhi"}`
          : el.tags?.["addr:full"] || "Delhi NCR",
        phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
        openingHours: el.tags?.opening_hours || null,
      }));

    return NextResponse.json({
      category,
      radius,
      count: elements.length,
      elements,
    });
  } catch (err) {
    console.error("Overpass API Error:", err);
    return NextResponse.json(
      { error: "Failed to query nearby places from Overpass API" },
      { status: 500 }
    );
  }
}
