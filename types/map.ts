export type LayerType = "osm" | "satellite" | "dark" | "terrain";

export interface MapLayerConfig {
  id: LayerType;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

export interface LandmarkLocation {
  id: string;
  name: string;
  hindiName?: string;
  category: "monument" | "religious" | "commercial" | "heritage";
  coordinates: [number, number]; // [lat, lng]
  description: string;
  builtYear?: string;
  architect?: string;
  highlights: string[];
  metroStation?: string;
  address?: string;
  imageUrl?: string;
  rating?: number;
}

export interface UserLocationState {
  coords: [number, number] | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  cursorCoords: [number, number] | null;
  activeLayer: LayerType;
}

export interface AreaIntelligenceData {
  directAnswer: string;
  rating?: number;
  reviewsCount?: string;
  vibe?: string;
  safetyScore?: string;
  crowdPeak?: string;
  bestTimeToVisit?: string;
  metroAccess?: string;
  popularEateries?: string[];
  highlights?: string[];
  insiderTip?: string;
  coordinates?: [number, number];
}
