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
  } catch (err) {
    console.error("Failed to delete shape:", err);
  }
  return updated;
}

export function clearAllShapes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("delhi_shapes_changed"));
  } catch (err) {
    console.error(err);
  }
}
