/* eslint-disable @typescript-eslint/no-explicit-any */
export type ShapeCoordinates =
  | [number, number]
  | [number, number][]
  | { center: [number, number]; radius: number };

export interface StoredShape {
  id: string;
  type: "marker" | "circle" | "polygon" | "polyline" | "rectangle" | "line";
  coordinates: ShapeCoordinates;
  measurements?: {
    distanceMeters?: number;
    distanceText?: string;
    areaMeters?: number;
    areaText?: string;
    radiusMeters?: number;
  };
  color?: string;
  createdAt: number;
}

const STORAGE_KEY = "delhi_drawn_shapes_v1";

export function loadSavedShapes(): StoredShape[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveShape(shape: StoredShape): StoredShape[] {
  const current = loadSavedShapes();
  const updated = [...current.filter((s) => s.id !== shape.id), shape];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("delhi_shapes_changed"));

    // Async sync to Server DB endpoint (/api/shapes)
    fetch("/api/shapes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shape }),
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to save shape:", err);
  }
  return updated;
}

export function deleteShape(id: string): StoredShape[] {
  const current = loadSavedShapes();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("delhi_shapes_changed"));

    // Async sync to Server DB endpoint (/api/shapes)
    fetch(`/api/shapes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to delete shape:", err);
  }
  return updated;
}

export function clearAllShapes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("delhi_shapes_changed"));

    fetch("/api/shapes?id=all", {
      method: "DELETE",
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to clear shapes:", err);
  }
}

// Convert all stored shapes into standard GeoJSON FeatureCollection
export function convertShapesToGeoJSON(shapes: StoredShape[]) {
  const features = shapes.map((s) => {
    let geometry: any = null;

    if (s.type === "marker") {
      const coords = s.coordinates as [number, number];
      geometry = {
        type: "Point",
        coordinates: [coords[1], coords[0]], // GeoJSON is [lng, lat]
      };
    } else if (s.type === "circle") {
      const c = s.coordinates as { center: [number, number]; radius: number };
      geometry = {
        type: "Point",
        coordinates: [c.center[1], c.center[0]],
      };
    } else if (s.type === "polyline" || (s.type as string) === "line") {
      const pts = s.coordinates as [number, number][];
      geometry = {
        type: "LineString",
        coordinates: pts.map((pt) => [pt[1], pt[0]]),
      };
    } else if (s.type === "polygon" || s.type === "rectangle") {
      const pts = s.coordinates as [number, number][];
      // Polygon ring must close (first coord === last coord)
      const ring = pts.map((pt) => [pt[1], pt[0]]);
      if (ring.length > 0) {
        ring.push(ring[0]);
      }
      geometry = {
        type: "Polygon",
        coordinates: [ring],
      };
    }

    return {
      type: "Feature",
      id: s.id,
      geometry,
      properties: {
        id: s.id,
        shapeType: s.type,
        color: s.color || "#3b82f6",
        measurements: s.measurements,
        createdAt: s.createdAt,
      },
    };
  });

  return {
    type: "FeatureCollection",
    name: "Delhi Explorer Drawn Shapes",
    features,
  };
}

// Export and trigger browser download of .geojson file
export function exportShapesToGeoJSON(): void {
  const shapes = loadSavedShapes();
  if (shapes.length === 0) {
    alert("No drawn shapes to export. Draw a polygon, line, circle, or marker first!");
    return;
  }

  const geojson = convertShapesToGeoJSON(shapes);
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `delhi-drawn-shapes-${Date.now()}.geojson`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Import shapes from uploaded GeoJSON file
export function importShapesFromGeoJSON(jsonText: string): number {
  try {
    const parsed = JSON.parse(jsonText);
    const features: any[] = parsed.features || (parsed.type === "Feature" ? [parsed] : []);
    if (!features.length) return 0;

    let addedCount = 0;
    features.forEach((f, idx) => {
      const geom = f.geometry;
      if (!geom) return;

      const id = "shape-import-" + Date.now() + "-" + idx;
      let type: StoredShape["type"] = "marker";
      let coordinates: ShapeCoordinates = [28.6139, 77.209];

      if (geom.type === "Point") {
        const [lng, lat] = geom.coordinates;
        const radius = f.properties?.measurements?.radiusMeters || f.properties?.radius;
        if (radius) {
          type = "circle";
          coordinates = { center: [lat, lng], radius: Math.round(radius) };
        } else {
          type = "marker";
          coordinates = [lat, lng];
        }
      } else if (geom.type === "LineString") {
        type = "polyline";
        coordinates = geom.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      } else if (geom.type === "Polygon") {
        type = "polygon";
        const ring = geom.coordinates[0] || [];
        coordinates = ring.map((c: [number, number]) => [c[1], c[0]]);
      }

      saveShape({
        id,
        type,
        coordinates,
        measurements: f.properties?.measurements,
        color: f.properties?.color || "#3b82f6",
        createdAt: Date.now(),
      });
      addedCount++;
    });

    return addedCount;
  } catch (err) {
    console.error("GeoJSON Import error:", err);
    throw new Error("Invalid GeoJSON file format.");
  }
}
