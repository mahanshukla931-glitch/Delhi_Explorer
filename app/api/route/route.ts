import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Free OpenStreetMap OSRM public routing endpoint
// Service: car (driving), foot (walking), bike (cycling)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startLat = searchParams.get("startLat");
    const startLng = searchParams.get("startLng");
    const endLat = searchParams.get("endLat");
    const endLng = searchParams.get("endLng");
    const mode = (searchParams.get("mode") || "driving") as "driving" | "walking" | "cycling";

    if (!startLat || !startLng || !endLat || !endLng) {
      return NextResponse.json(
        { error: "Missing start or end coordinates" },
        { status: 400 }
      );
    }

    // OSRM profile mapping
    const profile = mode === "walking" ? "foot" : mode === "cycling" ? "bike" : "car";

    // OSRM expects coordinates as: lng,lat;lng,lat
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DelhiExplorer/1.0",
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM API responded with status ${res.status}`);
    }

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found between coordinates" }, { status: 404 });
    }

    const primaryRoute = data.routes[0];
    // GeoJSON in OSRM gives coordinates as [lng, lat]. Leaflet needs [lat, lng].
    const coordinates: [number, number][] = primaryRoute.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const distanceMeters: number = primaryRoute.distance;
    const durationSeconds: number = primaryRoute.duration;

    // Format human-friendly text
    const distanceKm = (distanceMeters / 1000).toFixed(1);
    const distanceText = distanceMeters > 1000 ? `${distanceKm} km` : `${Math.round(distanceMeters)} m`;

    const mins = Math.round(durationSeconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const durationText =
      hours > 0 ? `${hours} hr ${remainingMins} min` : `${mins} min`;

    // Extract turn-by-turn steps
    const steps = (primaryRoute.legs?.[0]?.steps || []).map((st: {
      maneuver: { instruction?: string; type: string; modifier?: string; location: [number, number] };
      distance: number;
      duration: number;
      name: string;
    }) => {
      let instruction = st.maneuver.instruction;
      if (!instruction) {
        const type = st.maneuver.type;
        const mod = st.maneuver.modifier;
        const name = st.name || "the road";

        if (type === "depart") instruction = `Head out on ${name}`;
        else if (type === "arrive") instruction = `Arrive at your destination`;
        else if (type === "turn") instruction = `Turn ${mod || "ahead"} onto ${name}`;
        else if (type === "new name") instruction = `Continue onto ${name}`;
        else instruction = `Proceed on ${name}`;
      }

      return {
        instruction,
        distanceMeters: Math.round(st.distance),
        durationSeconds: Math.round(st.duration),
        name: st.name || "",
        type: st.maneuver.type,
        modifier: st.maneuver.modifier,
        coordinates: [st.maneuver.location[1], st.maneuver.location[0]], // [lat, lng]
      };
    });

    return NextResponse.json({
      coordinates,
      distanceMeters,
      durationSeconds,
      distanceText,
      durationText,
      mode,
      steps,
    });
  } catch (error) {
    console.error("Routing API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate navigation route. Please try again." },
      { status: 500 }
    );
  }
}
