"use client";

import React from "react";
import { X, Search, Navigation, Compass, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { NearbyPlaceItem } from "@/components/map/NearbyMarkersLayer";

interface NearbyPlacesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  centerCoords: [number, number];
  onSearchNearby: (category: string, radius: number) => Promise<void>;
  isLoading: boolean;
  places: NearbyPlaceItem[];
  error: string | null;
  onSelectPlace: (place: NearbyPlaceItem) => void;
  onRequestDirections?: (coords: [number, number], name: string) => void;
  onClearPlaces: () => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeRadius: number;
  setActiveRadius: (rad: number) => void;
}

const CATEGORIES = [
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "atm", label: "ATM", icon: "🏧" },
  { id: "hospital", label: "Hospital", icon: "🏥" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "bank", label: "Bank", icon: "🏦" },
  { id: "fuel", label: "Fuel / Gas", icon: "⛽" },
];

const RADII = [
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
];

export function NearbyPlacesDrawer({
  isOpen,
  onClose,
  centerCoords,
  onSearchNearby,
  isLoading,
  places,
  error,
  onSelectPlace,
  onRequestDirections,
  onClearPlaces,
  activeCategory,
  setActiveCategory,
  activeRadius,
  setActiveRadius,
}: NearbyPlacesDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-full sm:w-[380px] bg-white dark:bg-[#1a1b1e] shadow-2xl z-40 flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-250 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Find Nearby</h3>
            <p className="text-[11px] text-blue-100">Live Overpass API (OpenStreetMap)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Control Filters */}
      <div className="p-4 space-y-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
            1. Select Category
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((cat) => {
              const selected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    selected
                      ? "bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
            2. Search Radius
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {RADII.map((r) => {
              const selected = activeRadius === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setActiveRadius(r.value)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selected
                      ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center info & Action Buttons */}
        <div className="pt-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Center: {centerCoords[0].toFixed(4)}°, {centerCoords[1].toFixed(4)}°</span>
            {places.length > 0 && (
              <button
                onClick={onClearPlaces}
                className="text-red-500 hover:underline font-semibold"
              >
                Clear markers ({places.length})
              </button>
            )}
          </div>
          <button
            onClick={() => onSearchNearby(activeCategory, activeRadius)}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer active:scale-98"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Querying Overpass API...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scan {CATEGORIES.find((c) => c.id === activeCategory)?.label} Nearby</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results / Empty / Error State */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Search Error</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Scanning OpenStreetMap POIs...
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Querying live Overpass API within {activeRadius >= 1000 ? `${activeRadius / 1000} km` : `${activeRadius} m`}
            </p>
          </div>
        )}

        {!isLoading && !error && places.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <Compass className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Nearby Places Loaded Yet
            </p>
            <p className="text-[11px] text-slate-500 max-w-[240px] mt-1">
              Pick a category and radius above, then click scan to load live POIs onto the map.
            </p>
          </div>
        )}

        {!isLoading && places.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pb-1">
              <span>Found {places.length} results</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Showing on Map
              </span>
            </div>

            {places.map((place) => (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {place.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {place.address}
                    </p>
                  </div>
                  <span className="text-sm shrink-0">
                    {CATEGORIES.find((c) => c.id === place.category)?.icon || "📍"}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {place.coordinates[0].toFixed(4)}°, {place.coordinates[1].toFixed(4)}°
                  </span>
                  {onRequestDirections && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDirections(place.coordinates, place.name);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
