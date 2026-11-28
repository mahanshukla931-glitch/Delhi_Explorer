"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { HeatLayer } from "leaflet.heat";
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
  radius = 35,
  blur = 20,
  maxZoom = 17,
}: LeafletHeatLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<HeatLayer | null>(null);

  useEffect(() => {
    if (!visible || !map || !markers.length) {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current as unknown as L.Layer);
        } catch {
          // ignore
        }
        heatLayerRef.current = null;
      }
      return;
    }

    try {
      // Convert markers to [lat, lng, intensity]
      // Intensity derived from rating (default 0.7 if unrated)
      const heatPoints: Array<[number, number, number]> = markers.map((m) => {
        const intensity = m.rating
          ? Math.min(1.0, Math.max(0.45, m.rating / 5))
          : 0.65;
        return [m.coordinates[0], m.coordinates[1], intensity];
      });

      // Remove existing layer if any
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current as unknown as L.Layer);
        } catch {
          // ignore
        }
        heatLayerRef.current = null;
      }

      // Create new HeatLayer instance
      const layer = new HeatLayer(heatPoints, {
        radius,
        blur,
        minOpacity: 0.15,
        maxZoom,
        max: 1.0,
        gradient: {
          0.2: "#3b82f6", // Blue (low density)
          0.4: "#06b6d4", // Cyan
          0.6: "#10b981", // Emerald (medium)
          0.8: "#f59e0b", // Amber (busy)
          1.0: "#ef4444", // Red (hotspot)
        },
      });

      // Add HeatLayer instance to map
      map.addLayer(layer as unknown as L.Layer);
      heatLayerRef.current = layer;
    } catch (err) {
      console.error("Heatmap layer error:", err);
    }

    return () => {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current as unknown as L.Layer);
        } catch {
          // ignore
        }
        heatLayerRef.current = null;
      }
    };
  }, [map, markers, visible, radius, blur, maxZoom]);

  return null;
}
