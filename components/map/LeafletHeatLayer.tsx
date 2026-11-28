"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { MarkerPoi } from "@/types/geojson";

interface LeafletHeatLayerProps {
  markers: MarkerPoi[];
  visible: boolean;
  radius?: number;
  blur?: number;
  maxZoom?: number;
}

export function LeafletHeatLayer({
  markers,
  visible,
  radius = 25,
  blur = 18,
  maxZoom = 16,
}: LeafletHeatLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !map || !markers.length) return;

    // Convert markers to [lat, lng, intensity]
    // Intensity derived from rating (default 0.7 if unrated)
    const heatPoints: [number, number, number][] = markers.map((m) => {
      const intensity = m.rating ? Math.min(1.0, Math.max(0.4, m.rating / 5)) : 0.65;
      return [m.coordinates[0], m.coordinates[1], intensity];
    });

    // Create Leaflet heatLayer instance via leaflet.heat
    const heatLayer = L.heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom,
      max: 1.0,
      gradient: {
        0.2: "#3b82f6", // Blue (low density)
        0.4: "#06b6d4", // Cyan
        0.6: "#10b981", // Emerald
        0.8: "#f59e0b", // Amber
        1.0: "#ef4444", // Red (high density hotspots)
      },
    });

    heatLayer.addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, markers, visible, radius, blur, maxZoom]);

  return null;
}
