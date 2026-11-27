"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Moon,
  Sun,
  Layers,
  Sparkles,
  Info,
  MapPin,
  Compass,
  Download,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { LayerType } from "@/types/map";
import { getSavedLandmarks } from "@/lib/bookmarks";

interface GoogleMapsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: LayerType;
  onChangeLayer: (layer: LayerType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAskMaps?: () => void;
  showDistricts?: boolean;
  onToggleDistricts?: () => void;
  showMarkerClusters?: boolean;
  onToggleMarkerClusters?: () => void;
  showMetroLines?: boolean;
  onToggleMetroLines?: () => void;
  onOpenPlacesExplorer?: () => void;
  totalMarkersCount?: number;
  showDrawTools?: boolean;
  onToggleDrawTools?: () => void;
  onOpenNearby?: () => void;
}

export function GoogleMapsDrawer({
  isOpen,
  onClose,
  activeLayer,
  onChangeLayer,
  isDarkMode,
  onToggleDarkMode,
  onOpenAskMaps,
  showDistricts = true,
  onToggleDistricts,
  showMarkerClusters = true,
  onToggleMarkerClusters,
  showMetroLines = true,
  onToggleMetroLines,
  onOpenPlacesExplorer,
  totalMarkersCount = 1200,
  showDrawTools = false,
  onToggleDrawTools,
  onOpenNearby,
}: GoogleMapsDrawerProps) {
  const [savedCount, setSavedCount] = useState(0);

  // Sync saved count
  useEffect(() => {
    const updateCount = () => {
      try {
        setSavedCount(getSavedLandmarks().length);
      } catch {
        setSavedCount(0);
      }
    };
    updateCount();
    window.addEventListener("delhi_bookmarks_changed", updateCount);
    return () => window.removeEventListener("delhi_bookmarks_changed", updateCount);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = () => {
    const event = new CustomEvent("delhi_pwa_install_request");
    window.dispatchEvent(event);
    onClose();
  };

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
      />

      {/* Sleek Native Mobile & Desktop Navigation Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-[85vw] sm:w-[360px] max-w-[360px] bg-white dark:bg-[#1a1c1e] text-slate-800 dark:text-slate-100 z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 border-r border-slate-200/90 dark:border-slate-800">
        {/* 1. Modern Header */}
        <div className="p-4 sm:p-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
                <Image
                  src="/brand/icon-192.png"
                  alt="Delhi Explorer Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <h2 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  Delhi Explorer
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider inline-block">
                    Interactive Map
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {/* Delhi Explorer AI Premier Launch Card */}
          {onOpenAskMaps && (
            <button
              onClick={() => {
                onClose();
                onOpenAskMaps();
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md flex items-center justify-between group hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Ask AI Copilot</span>
                    <span className="text-[9px] bg-white/25 px-1.5 py-0.2 rounded font-extrabold uppercase">
                      New
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-100 font-normal truncate mt-0.5">
                    Live transit, landmarks & food guide
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          )}

          {/* Map Styles Section */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-slate-400">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Map Layers</span>
              </span>
              <span className="text-[10px] font-semibold text-blue-600 capitalize">
                {activeLayer === "osm" || activeLayer === "dark" ? "Street" : activeLayer}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onChangeLayer("osm")}
                className={`py-2 px-1 rounded-xl text-center border transition-all active:scale-95 flex flex-col items-center ${
                  activeLayer === "osm" || activeLayer === "dark"
                    ? "border-blue-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-500/30"
                    : "border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="text-lg">🗺️</span>
                <span className="text-[11px] mt-0.5">Street</span>
              </button>

              <button
                onClick={() => onChangeLayer("satellite")}
                className={`py-2 px-1 rounded-xl text-center border transition-all active:scale-95 flex flex-col items-center ${
                  activeLayer === "satellite"
                    ? "border-blue-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-500/30"
                    : "border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="text-lg">🛰️</span>
                <span className="text-[11px] mt-0.5">Satellite</span>
              </button>

              <button
                onClick={() => onChangeLayer("terrain")}
                className={`py-2 px-1 rounded-xl text-center border transition-all active:scale-95 flex flex-col items-center ${
                  activeLayer === "terrain"
                    ? "border-blue-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-500/30"
                    : "border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="text-lg">🏔️</span>
                <span className="text-[11px] mt-0.5">Terrain</span>
              </button>
            </div>
          </div>

          {/* Grouped Actions List */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 divide-y divide-slate-200/60 dark:divide-slate-700/50 overflow-hidden">
            {/* Night Mode Switch */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-2xs">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                    Night Mode
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isDarkMode ? "Dark Theme Active" : "Light Theme Active"}
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleDarkMode}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  isDarkMode ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-slate-600 justify-start"
                }`}
                aria-label="Toggle Night Mode"
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Delhi Metro Network Toggle */}
            {onToggleMetroLines && (
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs text-sm">
                    🚇
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Delhi Metro Network
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Lines, Interchanges & Stations
                    </span>
                  </div>
                </div>

                <button
                  onClick={onToggleMetroLines}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                    showMetroLines ? "bg-amber-500 justify-end" : "bg-slate-300 dark:bg-slate-600 justify-start"
                  }`}
                  aria-label="Toggle Delhi Metro"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            )}

            {/* Level 2: Delhi 11 Districts Choropleth Toggle */}
            {onToggleDistricts && (
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs text-sm">
                    🏛️
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Delhi Districts Layer
                    </span>
                    <span className="text-[10px] text-slate-400">
                      11 Districts GeoJSON Choropleth
                    </span>
                  </div>
                </div>

                <button
                  onClick={onToggleDistricts}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                    showDistricts ? "bg-indigo-600 justify-end" : "bg-slate-300 dark:bg-slate-600 justify-start"
                  }`}
                  aria-label="Toggle Districts Layer"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            )}

            {/* Level 2: Marker Clustering Toggle */}
            {onToggleMarkerClusters && (
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs text-sm">
                    📍
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Marker Clustering
                    </span>
                    <span className="text-[10px] text-slate-400">
                      1,200 High-Performance POIs
                    </span>
                  </div>
                </div>

                <button
                  onClick={onToggleMarkerClusters}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                    showMarkerClusters ? "bg-rose-600 justify-end" : "bg-slate-300 dark:bg-slate-600 justify-start"
                  }`}
                  aria-label="Toggle Marker Clustering"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            )}

            {/* Level 3: Drawing Tools & Measurement Switch */}
            {onToggleDrawTools && (
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs text-sm">
                    ✏️
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Drawing & Measurements
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Polygons, Lines, Area & Distance
                    </span>
                  </div>
                </div>

                <button
                  onClick={onToggleDrawTools}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                    showDrawTools ? "bg-purple-600 justify-end" : "bg-slate-300 dark:bg-slate-600 justify-start"
                  }`}
                  aria-label="Toggle Drawing Tools"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            )}

            {/* Level 3: Overpass Nearby Search */}
            {onOpenNearby && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNearby();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-white dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-2xs text-sm">
                    🔍
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Find Nearby (Overpass API)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Cafés, ATMs, Hospitals, Fuel & more
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}

            {/* Level 2: Places Explorer (1,200 Markers) */}
            {onOpenPlacesExplorer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPlacesExplorer();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-white dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shadow-2xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Places Explorer
                    </span>
                    <span className="text-[10px] text-slate-400">
                      1,200+ Clustered Directory & Filters
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {totalMarkersCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            )}

            {/* Saved Places */}
            {onOpenAskMaps && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAskMaps();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-white dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shadow-2xs">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Saved Places
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {savedCount > 0 ? `${savedCount} landmarks bookmarked` : "Bookmark places for 1-click access"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {savedCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {savedCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            )}

            {/* Install PWA App */}
            <button
              onClick={handleInstallClick}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-white dark:hover:bg-slate-800/60 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                    Install PWA App
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Offline map & home screen icon
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-600 text-white shadow-2xs group-hover:bg-blue-700 transition-colors">
                Install
              </span>
            </button>
          </div>

          {/* Quick Info & Tips */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>Features Overview</span>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delhi landmarks & red drop pins</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>All-India search & voice mic input</span>
              </li>
              <li className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>GPS locate me & live zoom/coordinates</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0 font-medium">
          <div className="flex items-center gap-1">
            <span>OpenStreetMap & Leaflet</span>
          </div>
          <span>Delhi Explorer</span>
        </div>
      </div>
    </>
  );
}
