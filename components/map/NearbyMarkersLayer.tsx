"use client";

import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

export interface NearbyPlaceItem {
  id: string;
  name: string;
  coordinates: [number, number];
  category: string;
  address: string;
  phone?: string | null;
  openingHours?: string | null;
}

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  cafe: { bg: "#f59e0b", icon: "☕" },
  atm: { bg: "#10b981", icon: "🏧" },
  hospital: { bg: "#ef4444", icon: "🏥" },
  restaurant: { bg: "#f97316", icon: "🍽️" },
  pharmacy: { bg: "#06b6d4", icon: "💊" },
  bank: { bg: "#3b82f6", icon: "🏦" },
  fuel: { bg: "#8b5cf6", icon: "⛽" },
};

function createNearbyIcon(category: string) {
  const conf = CATEGORY_COLORS[category] || { bg: "#6366f1", icon: "📍" };
  const html = `
    <div style="
      background: ${conf.bg};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid white;
      font-size: 16px;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      ${conf.icon}
    </div>
  `;

  return L.divIcon({
    html,
    className: "nearby-custom-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

interface NearbyMarkersLayerProps {
  places: NearbyPlaceItem[];
  onSelectPlace?: (place: NearbyPlaceItem) => void;
  onRequestDirections?: (coords: [number, number], name: string) => void;
}

export function NearbyMarkersLayer({
  places,
  onSelectPlace,
  onRequestDirections,
}: NearbyMarkersLayerProps) {
  if (!places || places.length === 0) return null;

  return (
    <>
      {places.map((place) => {
        const icon = createNearbyIcon(place.category);
        return (
          <Marker
            key={place.id}
            position={place.coordinates}
            icon={icon}
            eventHandlers={{
              click: () => onSelectPlace?.(place),
            }}
          >
            <Popup className="delhi-nearby-popup">
              <div className="p-1 min-w-[200px] font-sans">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">
                    {CATEGORY_COLORS[place.category]?.icon || "📍"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {place.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                  {place.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                  {place.address}
                </p>
                {place.openingHours && (
                  <p className="text-[11px] text-emerald-600 font-medium mb-2">
                    🕒 {place.openingHours}
                  </p>
                )}
                {onRequestDirections && (
                  <button
                    onClick={() => onRequestDirections(place.coordinates, place.name)}
                    className="w-full mt-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    🚗 Directions Here
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
