"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { MarkerPoi } from "@/types/geojson";

interface HeatLayerInstance extends L.Layer {
  setLatLngs: (latlngs: Array<[number, number, number]>) => HeatLayerInstance;
}

interface LeafletWithHeat {
  heatLayer?: (
    latlngs: Array<[number, number, number]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      gradient?: Record<number, string>;
    }
  ) => HeatLayerInstance;
}

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
  const heatLayerRef = useRef<HeatLayerInstance | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initHeatmap() {
      if (!visible || !map || !markers.length) {
        if (heatLayerRef.current && map) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
        return;
      }

      try {
        if (typeof window !== "undefined") {
          (window as unknown as { L: typeof L }).L = L;
          await import("leaflet.heat");
        }

        if (!isMounted) return;

        const heatPoints: Array<[number, number, number]> = markers.map((m) => {
          const intensity = m.rating
            ? Math.min(1.0, Math.max(0.4, m.rating / 5))
            : 0.65;
          return [m.coordinates[0], m.coordinates[1], intensity];
        });

        if (heatLayerRef.current && map) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }

        const leafletHeat = L as unknown as LeafletWithHeat;
        if (typeof leafletHeat.heatLayer === "function") {
          const layer = leafletHeat.heatLayer(heatPoints, {
            radius,
            blur,
            maxZoom,
            max: 1.0,
            gradient: {
              0.2: "#3b82f6",
              0.4: "#06b6d4",
              0.6: "#10b981",
              0.8: "#f59e0b",
              1.0: "#ef4444",
            },
          });

          layer.addTo(map);
          heatLayerRef.current = layer;
        }
      } catch (err) {
        console.warn("Leaflet.heat initialization warning:", err);
      }
    }

    initHeatmap();

    return () => {
      isMounted = false;
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch {
          // ignore
        }
        heatLayerRef.current = null;
      }
    };
  }, [map, markers, visible, radius, blur, maxZoom]);

  return null;
}
