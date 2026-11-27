import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory rate limiting timestamp for Nominatim (>= 1000ms between calls)
let lastNominatimCall = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng query parameters" }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json({ error: "Invalid numeric coordinates" }, { status: 400 });
    }

    // Rate limiting: strictly enforce <= 1 req/sec according to Nominatim usage policy
    const now = Date.now();
    const elapsed = now - lastNominatimCall;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    lastNominatimCall = Date.now();

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&addressdetails=1&zoom=18`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DelhiExplorer/1.0 (contact: info@delhiexplorer.local)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache reverse results for 24h
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Reverse geocoding service currently unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();

    const address = data.address || {};
    const street =
      address.road ||
      address.pedestrian ||
      address.neighbourhood ||
      address.suburb ||
      address.residential ||
      "";
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.state_district ||
      address.state ||
      "Delhi";
    const postcode = address.postcode || "";

    const shortAddress = [street, city, postcode].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "Delhi NCR";

    return NextResponse.json({
      lat: latNum,
      lng: lngNum,
      displayName: data.display_name || "Unknown Location",
      shortAddress,
      addressDetails: address,
      placeId: data.place_id,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to resolve address for coordinates" },
      { status: 500 }
    );
  }
}
