"use client";

import React, { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import {
  Crosshair,
  Loader2,
  Plus,
  Minus,
  Compass,
  Maximize2,
  Minimize2,
  Share2,
  Check,
} from "lucide-react";
import { LayerType, UserLocationState } from "@/types/map";
import { DELHI_DEFAULT_CENTER, DELHI_DEFAULT_ZOOM } from "@/lib/constants";

interface MapControlsOverlayProps {
  activeLayer: LayerType;
  onChangeLayer: (layer: LayerType) => void;
  userLocation: UserLocationState;
  onLocateUser: () => void;
  mapZoom: number;
  centerCoords: [number, number];
  cursorCoords?: [number, number] | null;
  onOpenShare?: (data: { title: string; url: string; description?: string }) => void;
}

export function MapControlsOverlay({
  activeLayer,
  onChangeLayer,
  userLocation,
  onLocateUser,
  mapZoom,
  centerCoords,
  cursorCoords,
  onOpenShare,
}: MapControlsOverlayProps) {
  const map = useMap();
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleResetDelhi = () => {
    map.flyTo(DELHI_DEFAULT_CENTER, DELHI_DEFAULT_ZOOM, { duration: 1.2 });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Exit fullscreen error:", err);
        });
      }
    }
  };

  const handleShareView = () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${centerCoords[0].toFixed(4)}&lng=${centerCoords[1].toFixed(4)}&z=${mapZoom}&layer=${activeLayer}`;

    if (onOpenShare) {
      onOpenShare({
        title: "Delhi Explorer Live Map View",
        url: shareUrl,
        description: `Coordinates: ${centerCoords[0].toFixed(4)}°N, ${centerCoords[1].toFixed(4)}°E (Zoom: ${mapZoom})`,
      });
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2600);
        })
        .catch(() => {
          prompt("Copy map share link:", shareUrl);
        });
    } else {
      prompt("Copy map share link:", shareUrl);
    }
  };

  return (
    <>
      {/* Bottom-Left: Google Maps Style Layer Switcher Floating Button */}
      <div
        className="leaflet-bottom leaflet-left"
        style={{ pointerEvents: "auto", zIndex: 1000 }}
      >
        <div className="relative mb-24 sm:mb-6 ml-3 sm:ml-4">
          <button
            onClick={() => setShowLayerMenu((prev) => !prev)}
            aria-label="Layers"
            className="group flex items-center gap-2 bg-white dark:bg-[#202124] hover:bg-slate-50 dark:hover:bg-[#2d2e30] border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-1.5 pr-3 shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
              {activeLayer === "satellite" ? "🛰️" : activeLayer === "terrain" ? "🏔️" : "🗺️"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-slate-400">Layer</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize">
                {activeLayer === "osm" ? "Street" : activeLayer}
              </div>
            </div>
          </button>

          {/* Quick Layer Switcher Flyout - Google Maps Style Visual Thumbnails */}
          {showLayerMenu && (
            <div className="absolute left-0 bottom-14 w-64 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-xl rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.28)] border border-slate-200/90 dark:border-white/10 p-3 z-[1000] animate-in slide-in-from-bottom-3 fade-in select-none">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Map Types
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                  Live View
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "osm",
                    name: "Default",
                    icon: "🗺️",
                    bgGradient: "from-blue-50 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-900/60",
                  },
                  {
                    id: "satellite",
                    name: "Satellite",
                    icon: "🛰️",
                    bgGradient: "from-emerald-900 to-slate-900 text-white",
                  },
                  {
                    id: "terrain",
                    name: "Terrain",
                    icon: "🏔️",
                    bgGradient: "from-amber-100 to-orange-100 dark:from-amber-950/60 dark:to-orange-900/60",
                  },
                ].map((item) => {
                  const isSelected = activeLayer === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChangeLayer(item.id as LayerType);
                        setShowLayerMenu(false);
                      }}
                      className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm"
                          : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.bgGradient} flex items-center justify-center text-2xl shadow-inner mb-1.5`}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          isSelected
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right: Google Maps Style Floating Action Controls */}
      <div
        className="leaflet-bottom leaflet-right"
        style={{ pointerEvents: "auto", zIndex: 1000 }}
      >
        <div className="flex flex-col items-center gap-2 mb-24 sm:mb-6 mr-3 sm:mr-4">
          {/* Google Maps Style Clean Pill Zoom Controls (+ / -) - High Visibility */}
          <div className="flex flex-col bg-white dark:bg-[#202124] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_14px_rgba(0,0,0,0.18)] overflow-hidden">
            <button
              onClick={() => map.zoomIn()}
              title="Zoom in (+)"
              aria-label="Zoom in"
              className="w-10 h-10 flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700 active:bg-blue-50 dark:active:bg-blue-950"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              onClick={() => map.zoomOut()}
              title="Zoom out (-)"
              aria-label="Zoom out"
              className="w-10 h-10 flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:bg-blue-50 dark:active:bg-blue-950"
            >
              <Minus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Compass / Recenter Delhi */}
          <button
            onClick={handleResetDelhi}
            title="Recenter to Central Delhi"
            aria-label="Recenter Delhi"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <Compass className="w-5 h-5 text-rose-500" />
          </button>

          {/* 1-Click Share View URL Button */}
          <button
            onClick={handleShareView}
            title={isCopied ? "Link Copied!" : "Share Map View"}
            aria-label="Share Map View"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group relative"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
            ) : (
              <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Fullscreen Toggle Button (Desktop view only, keeps mobile view clutter-free) */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
            aria-label="Fullscreen"
            className="hidden sm:flex w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          {/* Desktop Locate Me Button (On mobile, Locate is prominently in MobileBottomBar) */}
          <button
            onClick={onLocateUser}
            disabled={userLocation.loading}
            title="Your Location"
            aria-label="Locate me"
            className="hidden sm:flex w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {userLocation.loading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <Crosshair className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        </div>
      </div>

      {/* Share Toast Notification */}
      {isCopied && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900/95 dark:bg-[#1a1a1a]/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center gap-2.5 text-xs font-semibold border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{ pointerEvents: "none" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Map view link copied with live coords & zoom!</span>
        </div>
      )}

      {/* Subtle Google Maps Style Bottom Status Metric strip (Desktop only) */}
      <div
        className="leaflet-bottom hidden sm:block"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "12px",
          pointerEvents: "none",
          zIndex: 900,
        }}
      >
        <div className="bg-white/85 dark:bg-[#202124]/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-2.5 text-[10px] font-mono text-slate-700 dark:text-slate-200">
          <span>
            {cursorCoords
              ? `Cursor: ${cursorCoords[0].toFixed(4)}°N, ${cursorCoords[1].toFixed(4)}°E`
              : `Center: ${centerCoords[0].toFixed(4)}°N, ${centerCoords[1].toFixed(4)}°E`}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-400" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">Zoom: {mapZoom}</span>
        </div>
      </div>
    </>
  );
}
