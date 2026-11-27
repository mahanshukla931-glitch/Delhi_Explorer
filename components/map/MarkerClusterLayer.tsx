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

  useEffect(() => {
    // Custom Google Maps style cluster icon styling
    const clusterGroup = (L as unknown as { markerClusterGroup: (opts: Record<string, unknown>) => L.MarkerClusterGroup }).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        let bgClass = "bg-blue-600 border-blue-400";
        let size = 36;

        if (count > 100) {
          bgClass = "bg-rose-600 border-rose-400";
          size = 46;
        } else if (count > 40) {
          bgClass = "bg-amber-600 border-amber-400";
          size = 40;
        }

        return L.divIcon({
          html: `<div class="${bgClass} text-white font-extrabold text-xs rounded-full border-2 shadow-lg flex items-center justify-center w-full h-full select-none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));">${count}</div>`,
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

    const leafletMarkers: L.Marker[] = [];

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const pinColor = m.categoryColor || "#ea4335";
      const width = isSelected ? 30 : 24;
      const height = isSelected ? 38 : 32;

      const svgHtml = `
        <div style="width: ${width}px; height: ${height}px; transform: translate(-50%, -100%);">
          <svg viewBox="0 0 24 34" width="${width}" height="${height}" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.2"/>
            <circle cx="12" cy="11" r="3" fill="#ffffff"/>
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

      // Popup
      const popupHtml = `
        <div style="font-family: Roboto, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <h4 style="font-weight: 700; font-size: 13px; color: #202124; margin: 0;">${m.name}</h4>
          </div>
          <div style="font-size: 11px; color: ${m.categoryColor}; font-weight: 600; margin-bottom: 6px;">
            ${m.categoryLabel}
          </div>
          <p style="font-size: 11px; color: #5f6368; margin: 0 0 6px 0;">
            📍 ${m.address}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; border-top: 1px solid #dadce0; padding-top: 4px;">
            <span style="color: #f29900; font-weight: 700;">★ ${m.rating} (${m.reviewsCount})</span>
            <span style="color: ${m.isOpenNow ? "#1e8e3e" : "#ea4335"}; font-weight: 600;">
              ${m.isOpenNow ? "Open Now" : "Closed"}
            </span>
          </div>
        </div>
      `;

      leafletMarker.bindPopup(popupHtml);

      leafletMarker.on("click", () => {
        onSelectMarker(m);
      });

      leafletMarkers.push(leafletMarker);
    });

    clusterGroup.addLayers(leafletMarkers);
  }, [markers, selectedMarkerId, onSelectMarker]);

  return null;
}
