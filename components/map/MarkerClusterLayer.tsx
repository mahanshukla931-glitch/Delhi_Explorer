"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { MarkerPoi } from "@/types/geojson";

interface MarkerClusterGroupProps {
  markers: MarkerPoi[];
  selectedMarkerId: string | null;
  onSelectMarker: (marker: MarkerPoi) => void;
}

export function MarkerClusterLayer({
  markers,
  selectedMarkerId,
  onSelectMarker,
}: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize MarkerClusterGroup
  useEffect(() => {
    const clusterGroup = (
      L as unknown as {
        markerClusterGroup: (opts: Record<string, unknown>) => L.MarkerClusterGroup;
      }
    ).markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 50,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        let bgClass = "bg-blue-600 border-white text-white shadow-md ring-2 ring-blue-400/40";
        let size = 36;

        if (count > 100) {
          bgClass = "bg-rose-600 border-white text-white shadow-lg ring-2 ring-rose-400/50";
          size = 46;
        } else if (count > 40) {
          bgClass = "bg-amber-500 border-white text-white shadow-md ring-2 ring-amber-300/50";
          size = 40;
        }

        return L.divIcon({
          html: `<div class="${bgClass} font-black text-xs rounded-full border-2 flex items-center justify-center w-full h-full select-none" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">${count}</div>`,
          className: "custom-cluster-icon",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map]);

  // Update markers inside cluster group
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();
    markerMapRef.current.clear();

    const leafletMarkers: L.Marker[] = [];

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const pinColor = m.categoryColor || "#ea4335";
      const width = isSelected ? 30 : 24;
      const height = isSelected ? 38 : 32;

      const svgHtml = `
        <div style="width: ${width}px; height: ${height}px; transform: translate(-50%, -100%);">
          <svg viewBox="0 0 24 34" width="${width}" height="${height}" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.38));">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.4"/>
            <circle cx="12" cy="11" r="3.2" fill="#ffffff"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        html: svgHtml,
        className: "cluster-item-pin",
        iconSize: [width, height],
        iconAnchor: [width / 2, height],
        popupAnchor: [0, -height],
      });

      const leafletMarker = L.marker(m.coordinates, { icon });

      // Custom Google Maps style rich popup
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; max-width: 280px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 3px;">
            <h4 style="font-weight: 800; font-size: 13px; color: #1e293b; margin: 0; line-height: 1.25;">${m.name}</h4>
          </div>
          <div style="font-size: 10px; color: ${m.categoryColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            ${m.categoryLabel}
          </div>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0; line-height: 1.35;">
            📍 ${m.address}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 4px;">
            <span style="color: #d97706; font-weight: 700;">★ ${m.rating} <span style="font-weight: 500; color: #94a3b8;">(${m.reviewsCount})</span></span>
            <span style="font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; background: ${m.isOpenNow ? "#dcfce7" : "#fee2e2"}; color: ${m.isOpenNow ? "#15803d" : "#b91c1c"};">
              ${m.isOpenNow ? "Open Now" : "Closed"}
            </span>
          </div>
        </div>
      `;

      leafletMarker.bindPopup(popupHtml, {
        closeButton: true,
        className: "custom-leaflet-popup",
      });

      leafletMarker.on("click", () => {
        onSelectMarker(m);
      });

      leafletMarkers.push(leafletMarker);
      markerMapRef.current.set(m.id, leafletMarker);
    });

    clusterGroup.addLayers(leafletMarkers);
  }, [markers, selectedMarkerId, onSelectMarker]);

  // Fly and spiderfy when a marker is selected from the sidebar
  useEffect(() => {
    if (!selectedMarkerId || !clusterGroupRef.current) return;
    const targetMarker = markerMapRef.current.get(selectedMarkerId);
    if (targetMarker) {
      clusterGroupRef.current.zoomToShowLayer(targetMarker, () => {
        targetMarker.openPopup();
      });
    }
  }, [selectedMarkerId]);

  return null;
}
