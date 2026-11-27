import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export interface MarkerRecord {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  hub: string;
  coordinates: [number, number];
  rating: number;
  reviewsCount: number;
  address: string;
  isOpenNow: boolean;
}

export interface MarkersApiResponse {
  total: number;
  filteredCount: number;
  categories: { id: string; count: number }[];
  markers: MarkerRecord[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query")?.toLowerCase();
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 1200;

    const filePath = path.join(process.cwd(), "public", "data", "delhi_1000_markers.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Marker dataset not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(fileContent);
    let allMarkers: MarkerRecord[] = parsedData.markers || [];

    // Compute category counts before filtering for dashboard pills
    const categoryCounts: Record<string, number> = {};
    allMarkers.forEach((m) => {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    });

    // Apply category filter
    if (category && category !== "all") {
      allMarkers = allMarkers.filter((m) => m.category === category);
    }

    // Apply query search filter
    if (query && query.trim()) {
      allMarkers = allMarkers.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.hub.toLowerCase().includes(query) ||
          m.address.toLowerCase().includes(query)
      );
    }

    // Limit returned records if requested
    const sliced = allMarkers.slice(0, limit);

    const categoriesSummary = Object.entries(categoryCounts).map(([catId, count]) => ({
      id: catId,
      count,
    }));

    const response: MarkersApiResponse = {
      total: parsedData.total || 1200,
      filteredCount: allMarkers.length,
      categories: categoriesSummary,
      markers: sliced,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Markers API error:", err);
    return NextResponse.json({ error: "Failed to load markers" }, { status: 500 });
  }
}
