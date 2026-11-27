import { NextRequest, NextResponse } from "next/server";
import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// In-memory rate limiting timestamp for Nominatim (>= 1000ms between calls)
let lastNominatimCall = 0;

// Helper: calculate Haversine distance in meters
function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Resilient fallback when external Nominatim fails or times out
function getFallbackLocation(latNum: number, lngNum: number) {
  // Find closest landmark in Delhi
  let closest = DELHI_PRIMARY_LANDMARKS[0];
  let minDistance = Infinity;

  for (const lm of DELHI_PRIMARY_LANDMARKS) {
    const dist = getHaversineDistance(latNum, lngNum, lm.coordinates[0], lm.coordinates[1]);
    if (dist < minDistance) {
      minDistance = dist;
      closest = lm;
    }
  }

  const distKm = (minDistance / 1000).toFixed(1);
  let shortAddress = "";
  let displayName = "";

  if (minDistance < 2000) {
    shortAddress = `Near ${closest.name}, Delhi`;
    displayName = `${closest.name} area, ${closest.address || "Delhi, India"}`;
  } else if (minDistance < 30000) {
    shortAddress = `Delhi NCR (${distKm} km from ${closest.name})`;
    displayName = `Location near ${closest.name}, Delhi NCR [${latNum.toFixed(4)}, ${lngNum.toFixed(4)}]`;
  } else {
    // Outer region or interstate (e.g. user GPS in another city like Bhopal)
    shortAddress = `Coordinates [${latNum.toFixed(3)}, ${lngNum.toFixed(3)}]`;
    displayName = `Current Location [${latNum.toFixed(4)}, ${lngNum.toFixed(4)}] (${distKm} km from Delhi)`;
  }

  return {
    lat: latNum,
    lng: lngNum,
    displayName,
    shortAddress,
    addressDetails: {
      road: `Near ${closest.name}`,
      city: "Delhi NCR",
      state: "Delhi",
      country: "India",
    },
    placeId: `fallback_${Math.round(latNum * 1000)}_${Math.round(lngNum * 1000)}`,
  };
}

export async function GET(request: NextRequest) {
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

  try {
    // Rate limiting: strictly enforce <= 1 req/sec according to Nominatim usage policy
    const now = Date.now();
    const elapsed = now - lastNominatimCall;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    lastNominatimCall = Date.now();

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&addressdetails=1&zoom=18`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DelhiExplorer/1.0 (contact: info@delhiexplorer.local)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache reverse results for 24h
    });

    clearTimeout(timeoutId);

    if (res.ok) {
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

      const shortAddress =
        [street, city, postcode].filter(Boolean).join(", ") ||
        data.display_name?.split(",").slice(0, 3).join(",") ||
        "Delhi NCR";

      return NextResponse.json({
        lat: latNum,
        lng: lngNum,
        displayName: data.display_name || "Delhi NCR Location",
        shortAddress,
        addressDetails: address,
        placeId: data.place_id,
      });
    }
  } catch (error) {
    console.warn("External Nominatim reverse fetch warning (using resilient fallback):", error);
  }

  // Resilient fallback guarantees 200 OK without crashing the UI
  const fallback = getFallbackLocation(latNum, lngNum);
  return NextResponse.json(fallback);
}
