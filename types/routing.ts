export type TravelMode = "driving" | "walking" | "cycling";

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
  type: string;
  modifier?: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface RouteData {
  coordinates: [number, number][]; // Array of [lat, lng]
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  mode: TravelMode;
  steps: RouteStep[];
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
}

export interface MetroRouteSummary {
  originStation: string;
  destinationStation: string;
  lines: string[];
  interchanges: string[];
  totalStations: number;
  estimatedMinutes: number;
  fareRupees: number;
  stationList: string[];
}
