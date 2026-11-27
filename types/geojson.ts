export interface DistrictProperties {
  name: string;
  hindiName: string;
  headquarters: string;
  areaKm2: number;
  population: number;
  density: number;
  literacyRate: number;
  subDivisions: string[];
}

export interface MarkerPoi {
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

export interface ChoroplethMetric {
  key: "density" | "population" | "literacyRate" | "areaKm2";
  label: string;
  unit: string;
}
