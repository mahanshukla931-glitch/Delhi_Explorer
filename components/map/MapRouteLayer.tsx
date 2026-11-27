"use client";

import React, { useEffect } from "react";
import { Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { RouteData } from "@/types/routing";

interface MapRouteLayerProps {
  route: RouteData | null;
  onClearRoute?: () => void;
}

export function MapRouteLayer({ route }: MapRouteLayerProps) {
  const map = useMap();

  // Auto-fit route bounds on map
  useEffect(() => {
    if (!route || route.coordinates.length === 0 || !map) return;
    try {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      });
    } catch (err) {
      console.error("Error fitting route bounds:", err);
    }
  }, [route, map]);

  if (!route || route.coordinates.length === 0) return null;

  // Custom Origin Icon (Start A - Google Maps Style Green)
  const startIcon = L.divIcon({
    html: `
      <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
        <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);">
          A
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #10b981; margin-top: -1px;"></div>
      </div>
    `,
    className: "route-pin-start",
    iconSize: [30, 36],
    iconAnchor: [15, 36],
    popupAnchor: [0, -36],
  });

  // Custom Destination Icon (Finish B - Google Maps Style Red Pin)
  const endIcon = L.divIcon({
    html: `
      <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
        <div style="background: #ea4335; color: white; width: 30px; height: 30px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(234, 67, 53, 0.45);">
          B
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #ea4335; margin-top: -1px;"></div>
      </div>
    `,
    className: "route-pin-end",
    iconSize: [30, 36],
    iconAnchor: [15, 36],
    popupAnchor: [0, -36],
  });

  return (
    <>
      {/* Outer route shadow casing */}
      <Polyline
        positions={route.coordinates}
        pathOptions={{
          color: "#1e3a8a",
          weight: 8,
          opacity: 0.6,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* Main vibrant navigation polyline (Google Maps Blue) */}
      <Polyline
        positions={route.coordinates}
        pathOptions={{
          color: "#2563eb",
          weight: 5.5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* Start Point Pin (A) */}
      <Marker position={route.originCoords} icon={startIcon}>
        <Popup className="custom-leaflet-popup">
          <div className="p-1 font-sans text-xs">
            <span className="font-extrabold text-emerald-600 block uppercase text-[10px]">
              Origin (Start A)
            </span>
            <span className="font-bold text-slate-800 dark:text-white">
              {route.originName}
            </span>
          </div>
        </Popup>
      </Marker>

      {/* Destination Point Pin (B) */}
      <Marker position={route.destinationCoords} icon={endIcon}>
        <Popup className="custom-leaflet-popup">
          <div className="p-1 font-sans text-xs">
            <span className="font-extrabold text-rose-600 block uppercase text-[10px]">
              Destination (Finish B)
            </span>
            <span className="font-bold text-slate-800 dark:text-white">
              {route.destinationName}
            </span>
            <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>{route.distanceText}</span>
              <span className="text-blue-600">{route.durationText}</span>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
