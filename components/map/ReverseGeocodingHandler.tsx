"use client";

import React, { useState } from "react";
import { useMapEvents, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Navigation, Compass, MapPin, Loader2, X } from "lucide-react";

interface ReverseGeocodedPoint {
  lat: number;
  lng: number;
  displayName?: string;
  shortAddress?: string;
  loading: boolean;
  error?: string | null;
}

interface ReverseGeocodingHandlerProps {
  enabled?: boolean;
  onRequestDirections?: (coords: [number, number], name: string) => void;
  onFindNearbyHere?: (coords: [number, number]) => void;
}

// Sleek drop pin icon for clicked point
const clickPinIcon = L.divIcon({
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      transform: translate(-50%, -100%);
    ">
      <div style="
        width: 24px;
        height: 24px;
        background: #ef4444;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
      <div style="
        position: absolute;
        bottom: -4px;
        left: 8px;
        width: 8px;
        height: 3px;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        filter: blur(1px);
      "></div>
    </div>
  `,
  className: "reverse-click-pin",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -26],
});

export function ReverseGeocodingHandler({
  enabled = true,
  onRequestDirections,
  onFindNearbyHere,
}: ReverseGeocodingHandlerProps) {
  const [clickedPoint, setClickedPoint] = useState<ReverseGeocodedPoint | null>(null);

  const map = useMapEvents({
    click: async (e) => {
      if (!enabled) return;

      // If Geoman is actively drawing or dragging, do not trigger reverse geocoding popup
      const pm = (map as unknown as { pm?: { globalDrawMode?: () => boolean; globalEditMode?: () => boolean; globalDragMode?: () => boolean } }).pm;
      if (pm && (pm.globalDrawMode?.() || pm.globalEditMode?.() || pm.globalDragMode?.())) {
        return;
      }

      const { lat, lng } = e.latlng;
      setClickedPoint({
        lat,
        lng,
        loading: true,
        error: null,
      });

      try {
        const res = await fetch(`/api/reverse?lat=${lat}&lng=${lng}`);
        if (!res.ok) {
          throw new Error("Unable to resolve address");
        }
        const data = await res.json();
        setClickedPoint({
          lat,
          lng,
          displayName: data.displayName,
          shortAddress: data.shortAddress,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Reverse geocoding click error:", err);
        setClickedPoint((prev) =>
          prev ? { ...prev, loading: false, error: "Address lookup failed" } : null
        );
      }
    },
  });

  if (!clickedPoint) return null;

  return (
    <Marker position={[clickedPoint.lat, clickedPoint.lng]} icon={clickPinIcon}>
      <Popup
        position={[clickedPoint.lat, clickedPoint.lng]}
        eventHandlers={{
          remove: () => setClickedPoint(null),
        }}
        autoPan={true}
        className="reverse-geocode-popup"
      >
        <div className="p-1 min-w-[220px] max-w-[270px] font-sans">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Clicked Location
            </span>
            <button
              onClick={() => setClickedPoint(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {clickedPoint.loading ? (
            <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Resolving address...</span>
            </div>
          ) : clickedPoint.error ? (
            <div className="py-2 text-xs text-red-500">
              {clickedPoint.error}
            </div>
          ) : (
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                {clickedPoint.shortAddress || "Selected Point"}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {clickedPoint.displayName}
              </p>
              <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
                {clickedPoint.lat.toFixed(5)}°, {clickedPoint.lng.toFixed(5)}°
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5">
                {onRequestDirections && (
                  <button
                    onClick={() => {
                      onRequestDirections(
                        [clickedPoint.lat, clickedPoint.lng],
                        clickedPoint.shortAddress || "Clicked Point"
                      );
                      setClickedPoint(null);
                    }}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Navigate</span>
                  </button>
                )}
                {onFindNearbyHere && (
                  <button
                    onClick={() => {
                      onFindNearbyHere([clickedPoint.lat, clickedPoint.lng]);
                      setClickedPoint(null);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Nearby</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
